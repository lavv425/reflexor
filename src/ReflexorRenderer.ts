import Reflexor from "./Reflexor";

class ReflexorRenderer {
    /**
     * Map to associate DOM elements with reactive states.
     * @private
     */
    private bindings: Map<HTMLElement, { state: any; listener: Function }>;
    private updateQueue: Map<HTMLElement, any> = new Map();
    private batchId: number | null = null;
    private virtualizedComponents: HTMLElement[] = [];
    private observer: IntersectionObserver | null = null;

    constructor() {
        if (typeof window === "undefined" || !window.document) {
            throw new Error("ReflexorRenderer requires a DOM environment.");
        }
        this.bindings = new Map();
    }

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
    public bind(element: HTMLElement, state: any, options?: { className?: string; attributes?: { [key: string]: string } }): void {
        if (!element || !state) {
            throw new Error("Invalid element or state for binding.");
        }

        if (options?.className) {
            element.classList.add(options.className);
        }

        if (options?.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        // Update the DOM element with the current state value
        this.batchUpdateElement(element, state.value);

        // Register a listener to update the DOM element when the state changes
        Reflexor.onReflexChange((newValue: any) => {
            this.batchUpdateElement(element, newValue);
        }, [state]);

        // Save the binding
        this.bindings.set(element, state);
    }

    public bindWithjQuery(element: JQuery, state: any): void {
        const domElement = element[0];
        this.bind(domElement, state);
    }

    /**
     * Unbinds a DOM element from its reactive state.
     * @param {HTMLElement} element - The DOM element to unbind.
     */
    public unbind(element: HTMLElement): void {
        const state = this.bindings.get(element);
        if (state) {
            Reflexor.removeReflex(state); // Remove state listeners
            this.bindings.delete(element); // Remove binding
        }
    }

    /**
     * Batches updates to DOM elements.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {any} value - The new value to set.
     */
    private batchUpdateElement(element: HTMLElement, value: any): void {
        this.updateQueue.set(element, value);

        if (this.batchId === null) {
            this.batchId = requestAnimationFrame(() => {
                this.updateQueue.forEach((value, element) => {
                    this.updateElement(element, value);
                });
                this.updateQueue.clear();
                this.batchId = null;
            });
        }
    }

    /**
     * Updates a DOM element with a value.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {any} value - The new value to set.
     * @private
     */
    private updateElement(element: HTMLElement, value: any): void {
        if (!element) {
            console.warn("Element is null or undefined. Skipping update.");
            return;
        }


        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            // input and textarea
            element.value = value;
        } else if (element instanceof HTMLSelectElement) {
            // select
            const option = Array.from(element.options).find((opt) => opt.value === value.toString());
            if (option) {
                element.value = value.toString();
            } else {
                console.warn(`Value "${value}" not found in select options.`);
            }
        } else if (element instanceof HTMLImageElement) {
            // img, update src
            element.src = value.toString();
        } else if (element instanceof HTMLAnchorElement) {
            // a, update href and text
            element.href = value.toString();
            element.textContent = value.toString();
        } else if (element instanceof HTMLProgressElement) {
            // progress
            element.value = parseFloat(value);
        } else if (element instanceof HTMLMeterElement) {
            // meter
            element.value = parseFloat(value);
        } else if (element instanceof HTMLButtonElement) {
            // button
            element.textContent = value.toString();
        } else {
            // Default
            element.textContent = value.toString();
        }
    }

    /**
     * Renders a dynamically defined component.
     * @param {HTMLElement} container - The container where the component is mounted.
     * @param {() => string} renderFunction - A function that returns the component's HTML.
     * @param {any[]} states - Reactive states to observe.
     */
    public render(container: HTMLElement, renderFunction: () => string, states: any[]): void {
        container.innerHTML = renderFunction();

        Reflexor.onReflexChange(() => {
            const newContent = renderFunction();
            if (container.innerHTML !== newContent) {
                container.innerHTML = newContent;
            }
        }, states);
    }

    /**
     * Initializes virtual DOM rendering.
     */
    private initializeVirtualization(container: HTMLElement): void {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const element = entry.target as HTMLElement;
                        element.style.visibility = "visible";
                    } else {
                        const element = entry.target as HTMLElement;
                        element.style.visibility = "hidden";
                    }
                });
            },
            { root: container, threshold: 0.1 }
        );
    }


    /**
     * Adds a component to the virtual DOM observer.
     * @param {HTMLElement} element - The DOM element to observe.
     */
    public addToVirtualDOM(element: HTMLElement): void {
        this.virtualizedComponents.push(element);
        this.observer!.observe(element);
    }
}

export default ReflexorRenderer;