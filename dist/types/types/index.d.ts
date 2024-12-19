export type Listener = (value: any) => void;
/**
 * Interface representing a reflex.
 */
export interface ReactiveState {
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
