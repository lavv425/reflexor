import md5 from "../old/utils";

type Listener = (value: any) => void;

/**
 * Interface representing a reactive state.
 */
interface ReactiveState {
    /** The current value of the state */
    value: any;
    /** The initial value of the state */
    initialValue: any;
    /** Listeners for value changes */
    listeners: Listener[];
    /** Listeners for value removal */
    dropListeners: Listener[];
    /** Listeners for value resets */
    resetListeners: Listener[];
    /** Whether the state is persisted in localStorage */
    persisted: boolean;
    /** Unique key for localStorage */
    key?: string;
}

const LOCAL_STORAGE_KEY = "reactiveStates";
const reactiveStates = new Map<any, ReactiveState>();

/**
 * Creates a reactive state.
 * 
 * @param {any} initialValue - The initial value of the state.
 * @param {boolean} [persisted=false] - Whether the state should be persisted in localStorage.
 * @param {string} [key] - Optional unique key for identifying the state in localStorage.
 * @returns {Proxy} - A proxy for the reactive state.
 */
const reactify = (initialValue: any, persisted: boolean = false, key?: string) => {
    const reactiveKey = key ? md5(`${LOCAL_STORAGE_KEY}-${key}`) : '';
    const savedValue = persisted && reactiveKey ? localStorage.getItem(reactiveKey) : null;

    const state: ReactiveState = {
        value: savedValue !== null ? JSON.parse(savedValue) : initialValue,
        initialValue,
        listeners: [],
        dropListeners: [],
        resetListeners: [],
        persisted,
        key: reactiveKey,
    };

    reactiveStates.set(state, state);

    const proxy = new Proxy(state, {
        /**
         * Intercept property updates.
         * 
         * @param {ReactiveState} target - The reactive state.
         * @param {string | symbol} prop - The property being set.
         * @param {any} value - The new value.
         * @returns {boolean} - Whether the operation was successful.
         */
        set(target, prop, value) {
            if (prop === 'value') {
                target.value = value;

                target.listeners.forEach((listener) => listener(value));

                if (target.persisted && target.key) {
                    localStorage.setItem(target.key, JSON.stringify(value));
                }

                return true;
            }
            return false;
        },
        /**
         * Intercept property deletion.
         * 
         * @param {ReactiveState} target - The reactive state.
         * @param {string | symbol} prop - The property being deleted.
         * @returns {boolean} - Whether the operation was successful.
         */
        deleteProperty(target, prop) {
            if (prop === 'value') {
                target.dropListeners.forEach((listener) => listener(target.value));
                delete target.value;

                if (target.persisted && target.key) {
                    localStorage.removeItem(target.key);
                }

                return true;
            }
            return false;
        },
    });

    return proxy;
};

/**
 * Registers a listener for value changes in reactive states.
 * 
 * @param {Listener} funct - The function to be called on value changes.
 * @param {any[]} deps - Dependencies (reactive states) to listen to.
 */
const onValueChange = (funct: Listener, deps: any[]) => {
    deps.forEach((dep) => {
        const state = reactiveStates.get(dep);
        if (state) {
            state.listeners.push(funct);
        }
    });
};

/**
 * Registers a listener for value removal in reactive states.
 * 
 * @param {Listener} funct - The function to be called on value removal.
 * @param {any[]} deps - Dependencies (reactive states) to listen to.
 */
const onValueDrop = (funct: Listener, deps: any[]) => {
    deps.forEach((dep) => {
        const state = reactiveStates.get(dep);
        if (state) {
            state.dropListeners.push(funct);
        }
    });
};

/**
 * Registers a listener for state reset.
 * 
 * @param {Listener} funct - The function to be called on state reset.
 * @param {any[]} deps - Dependencies (reactive states) to listen to.
 */
const onValueReset = (funct: Listener, deps: any[]) => {
    deps.forEach((dep) => {
        const state = reactiveStates.get(dep);
        if (state) {
            state.resetListeners.push(funct);
        }
    });
};

/**
 * Resets a reactive state to its initial value.
 * 
 * @param {any} state - The reactive state to reset.
 */
const reset = (state: any) => {
    const reactiveState = reactiveStates.get(state);
    if (reactiveState) {
        reactiveState.value = reactiveState.initialValue;

        if (reactiveState.persisted && reactiveState.key) {
            localStorage.setItem(reactiveState.key, JSON.stringify(reactiveState.initialValue));
        }

        reactiveState.listeners.forEach((listener) => listener(reactiveState.initialValue));
        reactiveState.resetListeners.forEach((listener) => listener(reactiveState.initialValue));
    }
};