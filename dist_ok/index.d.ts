import { Listener, ReactiveState } from "./types";
/**
 * Reflexor Class - A reactive state management library with persistence and batching capabilities.
 */
declare class Reflexor {
    /**
     * Stores all reactive states.
     * @private
     */
    private static reflexStates;
    /**
     * Indicates whether the current environment is Node.js.
     * @private
     */
    private static isNode;
    /**
     * Tracks whether Reflexor has been initialized.
     * @private
     */
    private static initialized;
    /**
     * Stores the initialization promise for async initialization.
     * @private
     */
    private static initializationPromise;
    /**
     * Flag to determine if batching is enabled.
     * @private
     */
    private static batchingEnabled;
    /**
     * Stores batched updates for reactive states.
     * @private
     */
    private static batchedUpdates;
    /**
     * Manages a queue for transactions to avoid concurrency issues.
     * @private
     */
    private static transactionQueue;
    /**
     * Logger instance for debugging.
     * @private
     */
    private static logger;
    /**
     * Middleware functions to process updates.
     * @private
     */
    private static middlewares;
    private static fs;
    private static path;
    /**
     * File path used for storing reflex states in Node.js environment.
     * @private
     */
    private static FILE_PATH;
    /**
     * Opens an IndexedDB connection.
     * @param {string} dbName - Name of the database.
     * @param {string} storeName - Name of the object store.
     * @returns {Promise<IDBDatabase>} A promise that resolves to the database instance.
     * @private
     */
    private static openIndexedDB;
    /**
     * Saves a value to IndexedDB.
     * @param {string} key - The key for the value.
     * @param {any} value - The value to save.
     * @param {string} storeName - The object store name.
     * @returns {Promise<void>} A promise that resolves when the save is complete.
     */
    private static saveToIndexedDB;
    /**
     * Retrieves a value from IndexedDB.
     * @param {string} key - Key of the value.
     * @param {string} storeName - Name of the object store.
     * @returns {Promise<any>} A promise that resolves to the retrieved value.
     * @private
     */
    private static getFromIndexedDB;
    /**
     * Ensures that the local storage file exists (Node.js only).
     * @private
     */
    private static ensureFileExists;
    /**
     * Saves a value to a file (Node.js only).
     * @param {string} key - Key of the value.
     * @param {any} value - Value to save.
     * @private
     */
    private static saveToFile;
    /**
    * Retrieves a value from a file (Node.js only).
    * @param {string} key - Key of the value.
    * @returns {any} The retrieved value.
    * @private
    */
    private static getFromFile;
    /**
     * Saves a state to the appropriate storage (IndexedDB or file).
     * @param {string} key - Key of the state.
     * @param {any} value - Value to save.
     * @returns {Promise<void>} A promise that resolves when the save operation completes.
     * @private
     */
    private static saveState;
    /**
     * Retrieves a state from the appropriate storage (IndexedDB or file).
     * @param {string} key - Key of the state.
     * @returns {Promise<any>} A promise that resolves to the retrieved state value.
     * @private
     */
    private static getState;
    /**
     * Initializes Reflexor by loading all persisted states.
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */
    static initialize(): Promise<void>;
    /**
     * Enables batching of state updates.
     */
    static enableBatching(): void;
    /**
     * Disables batching of state updates.
     */
    static disableBatching(): void;
    /**
     * Flushes all batched updates, applying them to their respective states.
     */
    static flushBatches(): void;
    private static setValueWithBatching;
    /**
     * Queues a transaction to ensure concurrency safety.
     * @template T
     * @param {() => Promise<T>} transaction - The transaction function to queue.
     * @returns {Promise<T>} A promise that resolves when the transaction is complete.
     */
    private static enqueueTransaction;
    /**
     * Sets a custom logger for debugging.
     * @param {typeof console} customLogger - The custom logger.
     */
    static setLogger(customLogger: typeof console): void;
    /**
     * Logs a message at the specified level.
     * @param {"info" | "warn" | "error"} level - The log level.
     * @param {...any[]} args - The message and arguments to log.
     * @private
     */
    private static log;
    /**
     * Creates a new reactive state.
     * @param {any} initialValue - The initial value of the state.
     * @param {string} [key] - Optional key for persisting the state.
     * @returns {ReactiveState} A proxy object representing the reactive state.
     */
    static reflex(initialValue: any, key?: string): ReactiveState;
    /**
    * Retrieves the current value of a reactive state.
    * @param {any} state - The reactive state proxy.
    * @returns {any} The current value of the state.
    */
    static getReflexValue(state: any): any;
    /**
     * Checks if a reactive state exists.
     * @param {any} state - The reactive state proxy.
     * @returns {boolean} True if the state exists, false otherwise.
     */
    static hasReflex(state: any): boolean;
    /**
     * Removes a reactive state, including its persisted data if applicable.
     * @param {any} state - The reactive state proxy.
     */
    static removeReflex(state: any): void;
    /**
     * Retrieves all reactive states.
     * @returns {Map<any, ReactiveState>} A map of all reactive states.
     */
    static getAllReflexes(): Map<any, ReactiveState>;
    /**
     * Clears all reactive states, including persisted data if applicable.
     */
    static clearAllReflexes(): void;
    /**
     * Returns the total count of active reactive states.
     * @returns {number} The number of reactive states.
     */
    static getStateCount(): number;
    /**
     * Adds a middleware function to process state updates.
     * @param {(state: ReactiveState, value: any) => any} middleware - The middleware function.
     */
    static addMiddleware(middleware: (state: ReactiveState, value: any) => any): void;
    /**
     * Applies all middleware functions to a state value.
     * @param {ReactiveState} state - The reactive state.
     * @param {any} value - The value to process.
     * @returns {any} The processed value after applying all middleware.
     * @private
     */
    private static applyMiddlewares;
    /**
     * Sets the value of a reactive state after applying middleware.
     * @param {ReactiveState} state - The reactive state.
     * @param {any} value - The new value to set.
     * @private
     */
    private static setValueWithMiddleware;
    /**
     * Registers a listener for changes to the value of one or more reactive states.
     * @param {Listener} listener - The function to be called when a state value changes.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    static onReflexChange(listener: Listener, states: any[]): void;
    /**
     * Registers a listener for when one or more reactive states are removed.
     * @param {Listener} listener - The function to be called when a state is removed.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    static onReflexDrop(listener: Listener, states: any[]): void;
    /**
     * Registers a listener for when one or more reactive states are reset to their initial values.
     * @param {Listener} listener - The function to be called when a state is reset.
     * @param {any[]} states - An array of reactive state proxies to listen to.
     */
    static onReflexReset(listener: Listener, states: any[]): void;
    /**
     * Resets a reactive state to its initial value.
     * Triggers listeners for both value changes and resets.
     * @param {any} state - The reactive state proxy to reset.
     */
    static reset(state: any): void;
}
export declare const reflex: typeof Reflexor.reflex, onReflexChange: typeof Reflexor.onReflexChange, onReflexDrop: typeof Reflexor.onReflexDrop, onReflexReset: typeof Reflexor.onReflexReset, reset: typeof Reflexor.reset, initialize: typeof Reflexor.initialize, enableBatching: typeof Reflexor.enableBatching, flushBatches: typeof Reflexor.flushBatches, removeReflex: typeof Reflexor.removeReflex, getReflexValue: typeof Reflexor.getReflexValue, hasReflex: typeof Reflexor.hasReflex, getAllReflexes: typeof Reflexor.getAllReflexes, clearAllReflexes: typeof Reflexor.clearAllReflexes, addMiddleware: typeof Reflexor.addMiddleware, disableBatching: typeof Reflexor.disableBatching, getStateCount: typeof Reflexor.getStateCount, setLogger: typeof Reflexor.setLogger;
export {};
