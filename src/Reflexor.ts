import { STORAGE_KEY } from "./constants";
import { Listener, ReactiveState } from "./types";
import { md5 } from "./utils";

/**
 * Reflexor Class - A reactive state management library with persistence and batching capabilities.
 */
class Reflexor {
    /**
     * Stores all reactive states.
     * @private
     */
    private static reflexStates = new Map<any, ReactiveState>();

    /**
     * Indicates whether the current environment is Node.js.
     * @private
     */
    private static isNode = typeof window === "undefined";

    /**
     * Tracks whether Reflexor has been initialized.
     * @private
     */
    private static initialized = false;

    /**
     * Stores the initialization promise for async initialization.
     * @private
     */
    private static initializationPromise: Promise<void> | null = null;

    /**
     * Flag to determine if batching is enabled.
     * @private
     */
    private static batchingEnabled = false;

    /**
     * Stores batched updates for reactive states.
     * @private
     */
    private static batchedUpdates = new Map<string, any>();

    /**
     * Manages a queue for transactions to avoid concurrency issues.
     * @private
     */
    private static transactionQueue: Promise<any> = Promise.resolve();

    /**
     * Logger instance for debugging.
     * @private
     */
    private static logger = console;

    /**
     * Middleware functions to process updates.
     * @private
     */
    private static middlewares: ((state: ReactiveState, value: any) => any)[] = [];

    // Node.js File-based store
    private static fs = this.isNode ? require("fs") : null;
    private static path = this.isNode ? require("path") : null;
    /**
     * File path used for storing reflex states in Node.js environment.
     * @private
     */
    private static FILE_PATH = this.isNode ? this.path.resolve(__dirname, "reflexor_store.json") : null;

    /**
     * Opens an IndexedDB connection.
     * @param {string} dbName - Name of the database.
     * @param {string} storeName - Name of the object store.
     * @returns {Promise<IDBDatabase>} A promise that resolves to the database instance.
     * @private
     */
    private static async openIndexedDB(dbName = "ReflexorDB", storeName = "reflexStates"): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "key" });
                }
            };

            request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
            request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });
    }

    /**
     * Saves a value to IndexedDB.
     * @param {string} key - The key for the value.
     * @param {any} value - The value to save.
     * @param {string} storeName - The object store name.
     * @returns {Promise<void>} A promise that resolves when the save is complete.
     */
    private static async saveToIndexedDB(key: string, value: any, storeName = "reflexStates") {
        return this.enqueueTransaction(async () => {
            const db = await this.openIndexedDB();
            return new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                const request = store.put({ key, value });

                request.onsuccess = () => resolve();
                request.onerror = (event) => reject((event.target as IDBRequest).error);
            });
        });
    }

    /**
     * Retrieves a value from IndexedDB.
     * @param {string} key - Key of the value.
     * @param {string} storeName - Name of the object store.
     * @returns {Promise<any>} A promise that resolves to the retrieved value.
     * @private
     */
    private static async getFromIndexedDB(key: string, storeName = "reflexStates") {
        const db = await this.openIndexedDB();
        return new Promise<any>((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = (event) => resolve((event.target as IDBRequest).result?.value || null);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    }

    /**
     * Ensures that the local storage file exists (Node.js only).
     * @private
     */
    private static ensureFileExists() {
        if (this.isNode && !this.fs?.existsSync(this.FILE_PATH)) {
            this.fs.writeFileSync(this.FILE_PATH, JSON.stringify({}));
        }
    }

    /**
     * Saves a value to a file (Node.js only).
     * @param {string} key - Key of the value.
     * @param {any} value - Value to save.
     * @private
     */
    private static saveToFile(key: string, value: any) {
        if (!this.isNode) return;
        this.ensureFileExists();
        const store = JSON.parse(this.fs.readFileSync(this.FILE_PATH, "utf-8"));
        store[key] = value;
        this.fs.writeFileSync(this.FILE_PATH, JSON.stringify(store, null, 2));
    }

    /**
    * Retrieves a value from a file (Node.js only).
    * @param {string} key - Key of the value.
    * @returns {any} The retrieved value.
    * @private
    */
    private static getFromFile(key: string) {
        if (!this.isNode) return null;
        this.ensureFileExists();
        const store = JSON.parse(this.fs.readFileSync(this.FILE_PATH, "utf-8"));
        return store[key] || null;
    }

    // Dynamic save/get depending on environment
    /**
     * Saves a state to the appropriate storage (IndexedDB or file).
     * @param {string} key - Key of the state.
     * @param {any} value - Value to save.
     * @returns {Promise<void>} A promise that resolves when the save operation completes.
     * @private
     */
    private static async saveState(key: string, value: any) {
        if (this.isNode) {
            this.saveToFile(key, value);
        } else {
            await this.saveToIndexedDB(key, value);
        }
    }

    /**
     * Retrieves a state from the appropriate storage (IndexedDB or file).
     * @param {string} key - Key of the state.
     * @returns {Promise<any>} A promise that resolves to the retrieved state value.
     * @private
     */
    private static async getState(key: string) {
        if (this.isNode) {
            return this.getFromFile(key);
        } else {
            return await this.getFromIndexedDB(key);
        }
    }

    /**
     * Initializes Reflexor by loading all persisted states.
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */

    public static async initialize(): Promise<void> {
        if (this.initialized) return;

        const promises: Promise<void>[] = [];
        this.reflexStates.forEach((state) => {
            if (state.persisted && state.key) {
                promises.push(
                    this.getState(state.key).then((savedValue) => {
                        if (savedValue !== null) {
                            state.value = savedValue;
                        }
                    })
                );
            }
        });

        this.initializationPromise = Promise.all(promises).then(() => {
            this.initialized = true;
        });

        return this.initializationPromise;
    }

    /**
     * Enables batching of state updates.
     */
    public static enableBatching(): void {
        this.batchingEnabled = true;
    }

    /**
     * Disables batching of state updates.
     */
    public static disableBatching(): void {
        this.batchingEnabled = false;
    }

    /**
     * Flushes all batched updates, applying them to their respective states.
     */
    public static flushBatches(): void {
        this.batchingEnabled = false;
        this.batchedUpdates.forEach((value, key) => {
            const state = this.reflexStates.get(key);
            if (state) {
                state.value = value;
                state.listeners.forEach((listener) => listener(value));
            }
        });
        this.batchedUpdates.clear();
    }

    private static setValueWithBatching(state: ReactiveState, value: any): void {
        if (this.batchingEnabled) {
            this.batchedUpdates.set(state.key as string, value);
        } else {
            state.value = value;
            state.listeners.forEach((listener) => listener(value));
        }
    }

    // Transaction Queue
    /**
     * Queues a transaction to ensure concurrency safety.
     * @template T
     * @param {() => Promise<T>} transaction - The transaction function to queue.
     * @returns {Promise<T>} A promise that resolves when the transaction is complete.
     */
    private static enqueueTransaction<T>(transaction: () => Promise<T>): Promise<T> {
        this.transactionQueue = this.transactionQueue.then(transaction);
        return this.transactionQueue;
    }

    /**
     * Sets a custom logger for debugging.
     * @param {typeof console} customLogger - The custom logger.
     */
    public static setLogger(customLogger: typeof console): void {
        this.logger = customLogger;
    }

    /**
     * Logs a message at the specified level.
     * @param {"info" | "warn" | "error"} level - The log level.
     * @param {...any[]} args - The message and arguments to log.
     * @private
     */
    private static log(level: "info" | "warn" | "error", ...args: any[]): void {
        if (this.logger && typeof this.logger[level] === "function") {
            this.logger[level](...args);
        }
    }

    // Main Methods
    /**
     * Creates a new reactive state.
     * @param {any} initialValue - The initial value of the state.
     * @param {string} [key] - Optional key for persisting the state.
     * @returns {ReactiveState} A proxy object representing the reactive state.
     */
    public static reflex(initialValue: any, key?: string): ReactiveState {
        const persisted = Boolean(key && key.length > 0);
        const reactiveKey = persisted ? md5(`${STORAGE_KEY}-${key}`) : undefined;

        let stateValue = initialValue;

        if (reactiveKey) {
            this.getState(reactiveKey).then((savedValue) => {
                if (savedValue !== null) {
                    state.value = savedValue;
                    state.listeners.forEach((listener) => listener(savedValue));
                }
            }).catch((err) => {
                console.error("Error retrieving persisted value:", err);
            });
        }

        const state: ReactiveState = {
            value: stateValue,
            initialValue,
            listeners: [],
            dropListeners: [],
            resetListeners: [],
            persisted,
            key: reactiveKey,
        };

        const saveCurrentState = async () => {
            if (state.persisted && state.key) {
                await this.saveState(state.key, state.value);
            }
        };

        const proxy = new Proxy(state, {
            set: (target, prop, value) => {
                if (prop === "value") {
                    target.value = value;
                    target.listeners.forEach((listener) => listener(value));
                    saveCurrentState();
                    return true;
                }
                return false;
            },
            deleteProperty: (target, prop) => {
                if (prop === "value") {
                    target.dropListeners.forEach((listener) => listener(target.value));
                    delete target.value;

                    if (state.persisted && state.key) {
                        this.saveState(state.key, null);
                    }

                    return true;
                }
                return false;
            },
        });

        this.reflexStates.set(proxy, state);

        return proxy;
    }

    /**
    * Retrieves the current value of a reactive state.
    * @param {any} state - The reactive state proxy.
    * @returns {any} The current value of the state.
    */
    public static getReflexValue(state: any): any {
        const reactiveState = this.reflexStates.get(state);
        return reactiveState ? reactiveState.value : undefined;
    }

    /**
     * Checks if a reactive state exists.
     * @param {any} state - The reactive state proxy.
     * @returns {boolean} True if the state exists, false otherwise.
     */
    public static hasReflex(state: any): boolean {
        return this.reflexStates.has(state);
    }

    /**
     * Removes a reactive state, including its persisted data if applicable.
     * @param {any} state - The reactive state proxy.
     */
    public static removeReflex(state: any): void {
        const reactiveState = this.reflexStates.get(state);
        if (reactiveState && reactiveState.key) {
            this.saveState(reactiveState.key, null);
        }
        this.reflexStates.delete(state);
    }

    /**
     * Retrieves all reactive states.
     * @returns {Map<any, ReactiveState>} A map of all reactive states.
     */
    public static getAllReflexes(): Map<any, ReactiveState> {
        return this.reflexStates;
    }

    /**
     * Clears all reactive states, including persisted data if applicable.
     */
    public static clearAllReflexes(): void {
        this.reflexStates.forEach((state, key) => {
            if (state.persisted && state.key) {
                this.saveState(state.key, null);
            }
        });
        this.reflexStates.clear();
    }

    /**
     * Returns the total count of active reactive states.
     * @returns {number} The number of reactive states.
     */
    public static getStateCount(): number {
        return this.reflexStates.size;
    }

    /**
     * Adds a middleware function to process state updates.
     * @param {(state: ReactiveState, value: any) => any} middleware - The middleware function.
     */
    public static addMiddleware(middleware: (state: ReactiveState, value: any) => any): void {
        this.middlewares.push(middleware);
    }

    /**
     * Applies all middleware functions to a state value.
     * @param {ReactiveState} state - The reactive state.
     * @param {any} value - The value to process.
     * @returns {any} The processed value after applying all middleware.
     * @private
     */
    private static applyMiddlewares(state: ReactiveState, value: any): any {
        return this.middlewares.reduce((acc, middleware) => middleware(state, acc), value);
    }

    /**
     * Sets the value of a reactive state after applying middleware.
     * @param {ReactiveState} state - The reactive state.
     * @param {any} value - The new value to set.
     * @private
     */
    private static setValueWithMiddleware(state: ReactiveState, value: any): void {
        const newValue = this.applyMiddlewares(state, value);
        state.value = newValue;
        state.listeners.forEach((listener) => listener(newValue));
    }

    /**
     * Registers a listener for changes to the value of one or more reactive states.
     * @param {Listener} listener - The function to be called when a state value changes.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    public static onReflexChange(listener: Listener, states: any[]): void {
        states.forEach((state) => {
            const reactiveState = this.reflexStates.get(state);
            if (reactiveState) {
                reactiveState.listeners.push(listener);
            }
        });
    }

    /**
     * Registers a listener for when one or more reactive states are removed.
     * @param {Listener} listener - The function to be called when a state is removed.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    public static onReflexDrop(listener: Listener, states: any[]): void {
        states.forEach((state) => {
            const reactiveState = this.reflexStates.get(state);
            if (reactiveState) {
                reactiveState.dropListeners.push(listener);
            }
        });
    }
    /**
     * Registers a listener for when one or more reactive states are reset to their initial values.
     * @param {Listener} listener - The function to be called when a state is reset.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    public static onReflexReset(listener: Listener, states: any[]): void {
        states.forEach((state) => {
            const reactiveState = this.reflexStates.get(state);
            if (reactiveState) {
                reactiveState.resetListeners.push(listener);
            }
        });
    }
    /**
     * Resets a reactive state to its initial value.
     * Triggers listeners for both value changes and resets.
     * @param {any} state - The reactive state proxy to reset.
     */
    public static reset(state: any): void {
        const reactiveState = this.reflexStates.get(state);
        if (reactiveState) {
            reactiveState.value = reactiveState.initialValue;

            if (reactiveState.persisted && reactiveState.key) {
                this.saveState(reactiveState.key, reactiveState.initialValue);
            }

            reactiveState.listeners.forEach((listener) => listener(reactiveState.initialValue));
            reactiveState.resetListeners.forEach((listener) => listener(reactiveState.initialValue));
        }
    }

    /**
     * Static block for automatic initialization.
     */
    static {
        Reflexor.initialize().catch((err) => {
            console.error("Failed to initialize Reflexor:", err);
        });
    }
}

export const {
    reflex,
    onReflexChange,
    onReflexDrop,
    onReflexReset,
    reset,
    initialize,
    enableBatching,
    flushBatches,
    removeReflex,
    getReflexValue,
    hasReflex,
    getAllReflexes,
    clearAllReflexes,
    addMiddleware,
    disableBatching,
    getStateCount,
    setLogger,
} = Reflexor;

export default Reflexor;