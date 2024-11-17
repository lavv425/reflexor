export {};

declare global {
    interface Window {
        reactiveStateLib?: any;
    }
    interface GlobalThis {
        reactiveStateLib: any;
    }
    namespace NodeJS {
        interface Global {
            reactiveStateLib?: any;
        }
    }
}