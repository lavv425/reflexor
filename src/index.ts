(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        // Node.js/CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        // AMD (Asynchronous Module Definition)
        define([], factory);
    } else {
        // Global browser (Vanilla JS)
        (globalThis as any).reflexor = factory();
    }
})(typeof window !== "undefined" ? window : globalThis, function () {
    /**
     * Reactive State Library
     */
    const STORAGE_KEY = "reflex";
    const reflexStates = new Map<any, ReactiveState>();
    const isNode = typeof window === "undefined";

    /**
     * Generates an MD5 hash (standalone function).
     * @param {string} string - The input string.
     * @returns {string} - The MD5 hash.
     */
    const md5 = (string: string): string => {
        function rotateLeft(lValue: number, iShiftBits: number): number {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }

        function addUnsigned(lX: number, lY: number): number {
            const lX4 = lX & 0x40000000;
            const lY4 = lY & 0x40000000;
            const lX8 = lX & 0x80000000;
            const lY8 = lY & 0x80000000;
            const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
            if (lX4 & lY4) {
                return lResult ^ 0x80000000 ^ lX8 ^ lY8;
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
                } else {
                    return lResult ^ 0x40000000 ^ lX8 ^ lY8;
                }
            } else {
                return lResult ^ lX8 ^ lY8;
            }
        }

        function F(x: number, y: number, z: number): number {
            return (x & y) | (~x & z);
        }

        function G(x: number, y: number, z: number): number {
            return (x & z) | (y & ~z);
        }

        function H(x: number, y: number, z: number): number {
            return x ^ y ^ z;
        }

        function I(x: number, y: number, z: number): number {
            return y ^ (x | ~z);
        }

        function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
            a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
            a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
            a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
            a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function convertToWordArray(string: string): number[] {
            const lMessageLength = string.length;
            const lNumberOfWordsTemp1 = lMessageLength + 8;
            const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
            const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
            const lWordArray: number[] = new Array(lNumberOfWords - 1);
            let lBytePosition = 0;
            let lByteCount = 0;

            while (lByteCount < lMessageLength) {
                const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] =
                    lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
                lByteCount++;
            }

            const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        }

        function wordToHex(lValue: number): string {
            let wordToHexValue = "";
            for (let lCount = 0; lCount <= 3; lCount++) {
                const lByte = (lValue >>> (lCount * 8)) & 255;
                wordToHexValue += ("0" + lByte.toString(16)).slice(-2);
            }
            return wordToHexValue;
        }

        function utf8Encode(string: string): string {
            string = string.replace(/\r\n/g, "\n");
            let utftext = "";

            for (let n = 0; n < string.length; n++) {
                const c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if (c > 127 && c < 2048) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }

            return utftext;
        }

        let x: number[] = [],
            k,
            AA,
            BB,
            CC,
            DD,
            a: number,
            b: number,
            c: number,
            d: number;

        const S11 = 7,
            S12 = 12,
            S13 = 17,
            S14 = 22;
        const S21 = 5,
            S22 = 9,
            S23 = 14,
            S24 = 20;
        const S31 = 4,
            S32 = 11,
            S33 = 16,
            S34 = 23;
        const S41 = 6,
            S42 = 10,
            S43 = 15,
            S44 = 21;

        string = utf8Encode(string);

        x = convertToWordArray(string) as never[];

        a = 0x67452301;
        b = 0xefcdab89;
        c = 0x98badcfe;
        d = 0x10325476;

        for (k = 0; k < x.length; k += 16) {
            AA = a;
            BB = b;
            CC = c;
            DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
            b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
            a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
            c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
            c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
            a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
            a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
            d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
            a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
            a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
            a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
            c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x04881d05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
            a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
            c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
            b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
            c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
            d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
            c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
            a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
            d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
            b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
            a = addUnsigned(a, AA);
            b = addUnsigned(b, BB);
            c = addUnsigned(c, CC);
            d = addUnsigned(d, DD);
        }

        const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
        return temp.toLowerCase();
    }

    /**
     * Creates a reactive state.
     * 
     * @param {any} initialValue - The initial value of the state.
     * @param {boolean} [persisted=false] - Whether the state should be persisted in localStorage.
     * @param {string} [key] - Optional unique key for identifying the state in localStorage.
     * @returns {Proxy} - A proxy for the reactive state.
     */
    type Listener = (value: any) => void;

    /**
     * Interface representing a reflex.
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

    const openIndexedDB = async (dbName = "ReflexorDB", storeName = "reflexStates") => {
        return new Promise<IDBDatabase>((resolve, reject) => {
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
    };

    const saveToIndexedDB = async (key: string, value: any, storeName = "reflexStates") => {
        const db = await openIndexedDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    };

    const getFromIndexedDB = async (key: string, storeName = "reflexStates") => {
        const db = await openIndexedDB();
        return new Promise<any>((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = (event) => resolve((event.target as IDBRequest).result?.value || null);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    };

    // Node.js File-based store
    const fs = isNode ? require("fs") : null;
    const path = isNode ? require("path") : null;
    const FILE_PATH = isNode ? path.resolve(__dirname, "reflexor_store.json") : null;

    const ensureFileExists = () => {
        if (isNode && !fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, JSON.stringify({}));
        }
    };

    const saveToFile = (key: string, value: any) => {
        if (!isNode) return;
        ensureFileExists();
        const store = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
        store[key] = value;
        fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2));
    };

    const getFromFile = (key: string) => {
        if (!isNode) return null;
        ensureFileExists();
        const store = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
        return store[key] || null;
    };

    // Dynamic save/get depending on environment
    const saveState = async (key: string, value: any) => {
        if (isNode) {
            saveToFile(key, value);
        } else {
            await saveToIndexedDB(key, value);
        }
    };

    const getState = async (key: string) => {
        if (isNode) {
            return getFromFile(key);
        } else {
            return await getFromIndexedDB(key);
        }
    };

    /**
     * Creates a reflex.
     * 
     * @param {any} initialValue - The initial value of the state.
     * @param {string} [key] - Optional unique key for identifying the state in localStorage.
     * if the key is provided, the state will be persisted in localStorage
     * @returns {Proxy} - A proxy for the reflex.
     */
    const reflex = (initialValue: any, key?: string): ReactiveState => {
        const persisted = Boolean(key && key.length > 0);
        const reactiveKey = persisted ? md5(`${STORAGE_KEY}-${key}`) : undefined;

        let stateValue = initialValue;

        if (reactiveKey) {
            getState(reactiveKey).then((savedValue) => {
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
                await saveState(state.key, state.value);
            }
        };

        const proxy = new Proxy(state, {
            /**
             * Intercept property updates.
             * 
             * @param {ReactiveState} target - The reactive state.
             * @param {string | symbol} prop - The property being set.
             * @param {any} value - The new value.
             * @returns {boolean} - Whether the operation was successful.
             */
            set(target: ReactiveState, prop: string | symbol, value: any): boolean {
                if (prop === 'value') {
                    target.value = value;
                    target.listeners.forEach((listener) => listener(value));
                    saveCurrentState();
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
            deleteProperty(target: ReactiveState, prop: string | symbol): boolean {
                if (prop === 'value') {
                    target.dropListeners.forEach((listener) => listener(target.value));
                    delete target.value;

                    if (state.persisted && state.key) {
                        saveState(state.key, null);
                    }

                    return true;
                }
                return false;
            },
        });
        reflexStates.set(proxy, state);

        return proxy;
    };

    /**
     * Registers a listener for value changes in reflexes.
     * 
     * @param {Listener} funct - The function to be called on value changes.
     * @param {any[]} deps - Dependencies (reflexes) to listen to.
     */
    const onReflexChange = (funct: Listener, deps: any[]): void => {
        deps.forEach((dep) => {
            const state = reflexStates.get(dep);
            if (state) {
                state.listeners.push(funct);
            }
        });
    };

    /**
     * Registers a listener for value removal in reflexes.
     * 
     * @param {Listener} funct - The function to be called on value removal.
     * @param {any[]} deps - Dependencies (reflexes) to listen to.
     */
    const onReflexDrop = (funct: Listener, deps: any[]): void => {
        deps.forEach((dep) => {
            const state = reflexStates.get(dep);
            if (state) {
                state.dropListeners.push(funct);
            }
        });
    };

    /**
     * Registers a listener for reflexes state reset.
     * 
     * @param {Listener} funct - The function to be called on state reset.
     * @param {any[]} deps - Dependencies (reflexes) to listen to.
     */
    const onReflexReset = (funct: Listener, deps: any[]): void => {
        deps.forEach((dep) => {
            const state = reflexStates.get(dep);
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
    const reset = (state: any): void => {
        const reactiveState = reflexStates.get(state);
        if (reactiveState) {
            reactiveState.value = reactiveState.initialValue;

            if (reactiveState.persisted && reactiveState.key) {
                saveState(reactiveState.key, reactiveState.initialValue);
            }

            reactiveState.listeners.forEach((listener) => listener(reactiveState.initialValue));
            reactiveState.resetListeners.forEach((listener) => listener(reactiveState.initialValue));
        }
    };

    // functions export
    return {
        reflex,
        onReflexChange,
        onReflexDrop,
        onReflexReset,
        reset,
    };
});