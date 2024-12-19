declare class ReflexorRenderer {
    /**
     * Map to associate DOM elements with reactive states.
     * @private
     */
    private bindings;
    private updateQueue;
    private batchId;
    private virtualizedComponents;
    private observer;
    constructor();
    /**
     * Binds a DOM element to a reactive state.
     * @param {HTMLElement} element - The DOM element to bind.
     * @param {any} state - The reactive state.
     * @param {Object} [options] - Additional options.
     * @param {string} [options.className] - Class to add to the element.
     * @param {Object} [options.attributes] - Attributes to set on the element.
     * @example
     * renderer.bind(element, state, { className: "highlight", attributes: { "data-id": "123" } });
     */
    bind(element: HTMLElement, state: any, options?: {
        className?: string;
        attributes?: {
            [key: string]: string;
        };
    }): void;
    bindWithjQuery(element: JQuery, state: any): void;
    /**
     * Unbinds a DOM element from its reactive state.
     * @param {HTMLElement} element - The DOM element to unbind.
     */
    unbind(element: HTMLElement): void;
    /**
     * Batches updates to DOM elements.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {any} value - The new value to set.
     */
    private batchUpdateElement;
    /**
     * Updates a DOM element with a value.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {any} value - The new value to set.
     * @private
     */
    private updateElement;
    /**
     * Renders a dynamically defined component.
     * @param {HTMLElement} container - The container where the component is mounted.
     * @param {() => string} renderFunction - A function that returns the component's HTML.
     * @param {any[]} states - Reactive states to observe.
     */
    render(container: HTMLElement, renderFunction: () => string, states: any[]): void;
    /**
     * Initializes virtual DOM rendering.
     */
    private initializeVirtualization;
    /**
     * Adds a component to the virtual DOM observer.
     * @param {HTMLElement} element - The DOM element to observe.
     */
    addToVirtualDOM(element: HTMLElement): void;
}
export default ReflexorRenderer;
