import {OnAbort, OnAbortCallback} from "./OnAbort";
import {CancellablePromise} from "./CancellablePromise";

interface AbortablePromiseExecutor<T> {
    (resolve : (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, onAbort: OnAbort) : void
}

export interface AbortablePromise<T> extends Promise<T> {
    // Will result in the promise resolving with the given value
    abortWithResolve: (value?: T | PromiseLike<T>) => PromiseLike<void>;

    // Will result in the promise rejecting with the given value
    abortWithReject: (reason?: any) => PromiseLike<void>;
}

export class AbortablePromise<T> extends Promise<T> implements AbortablePromise<T> {
    public abortWithResolve: (value?: T | PromiseLike<T>) => PromiseLike<void>;
    public abortWithReject: (reason?: any) => PromiseLike<void>;

    // Handle internal usage in .then etc
    static get [Symbol.species]()
    {
        return Promise;
    }

    static fromAsync<T>(executor : (onAbort : OnAbort) => T | PromiseLike<T>) : AbortablePromise<T> {
        return new AbortablePromise<T>((resolve, reject, onAbort) => {
            try {
                resolve(executor(onAbort));
            }
            catch (ex) {
                reject(ex);
            }
        });
    }

    static fromPromise<T>(promise : PromiseLike<T>) : AbortablePromise<T> {
        return new AbortablePromise<T>((resolve, reject, onAbort) => {
            promise.then(resolve, reject);
        });
    }

    // @ts-ignore
    constructor(executor: AbortablePromiseExecutor<T>) {
        // handlers
        const handlers = [];

        // create the callee abort api
        const onAbortApi = (cb: OnAbortCallback) => {
            handlers.push(cb);
            return cb;
        };
        onAbortApi.remove = (cb: OnAbortCallback) => {
            handlers.splice(handlers.indexOf(cb), 1);
        };
        onAbortApi.isAborted = false;
        onAbortApi.withHandler = async (callback, handler) => {
            const handle = onAbortApi(handler);
            try {
                return await callback(onAbortApi);
            }
            finally {
                onAbortApi.remove(handle);
            }
        };

        // create the user promise
        const p = new Promise<T>((resolve, reject) => executor.call(undefined, resolve, reject, onAbortApi));

        // create the aborting promise
        let res;
        let rej;
        const a = new Promise<T>((resolve, reject) => {
            res = resolve;
            rej = reject;
        });

        // create the race
        const r = Promise.race([a, p]).finally(() => { handlers.splice(0) }) as AbortablePromise<T>;

        // create the caller abort api
        r.abortWithResolve = async (value?: T | PromiseLike<T>) => {
            res(value);
            await Promise.all(handlers.map(h => h()));
        };
        r.abortWithReject = async (reason?: any) => {
            rej(reason);
            await Promise.all(handlers.map(h => h()));
        };

        // This isn't a regular constructor so add the type chain manually
        Object.setPrototypeOf(r, AbortablePromise.prototype);

        return r;
    }
}