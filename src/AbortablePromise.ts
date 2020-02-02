import {OnAbort, OnAbortCallback, OnAbortHandle} from "./OnAbort";
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
        let isAborted = false;
        let isResolved = false;

        // create the callee abort api
        const onAbortApi = (cb: OnAbortCallback) => {
            const p = async () => {
                if (onAbortApi.isAborted)
                    await cb();
                return cb;
            };

            handlers.push([cb, p]);
            return p;
        };
        onAbortApi.remove = (cb: OnAbortHandle) => {
            handlers.splice(handlers.findIndex(val => (val[0] === cb || val[1] === cb)), 1);
        };
        onAbortApi.isAborted = false;
        Object.defineProperty(onAbortApi, 'isAborted', {
            get: () => isAborted
        });
        onAbortApi.withHandler = async (callback, handler) => {
            const handle = onAbortApi(handler);
            try {
                return await callback(onAbortApi);
            }
            finally {
                onAbortApi.remove(handle);
            }
        };

        // type check
        const onAbort : OnAbort = onAbortApi;

        // create the user promise
        const p = new Promise<T>((resolve, reject) => executor.call(undefined, resolve, reject, onAbort))
            .then(t => {
                isResolved = true;
                return t;
            });

        // create the aborting promise
        let res;
        let rej;
        const a = new Promise<T>((resolve, reject) => {
            res = resolve;
            rej = reject;
        });

        // create the race
        const r = Promise
            .race([a, p]) as any;

        // create the caller abort api
        r.abortWithResolve = async (value?: T | PromiseLike<T>) => {
            if (isAborted)
                throw new Error('AbortablePromise already aborted');
            if (isResolved)
                throw new Error('AbortablePromise already resolved');

            res(value);

            isAborted = true;
            await handlers.reduce(async (current, next) => {
                await current;
                const [,cb] = next;
                await cb();
            }, Promise.resolve());
        };
        r.abortWithReject = async (reason?: any) => {
            if (isAborted)
                throw new Error('AbortablePromise already aborted');
            if (isResolved)
                throw new Error('AbortablePromise already resolved');

            rej(reason);

            isAborted = true;
            await handlers.reduce(async (current, next) => {
                await current;
                const [,cb] = next;
                await cb();
            }, Promise.resolve());
        };

        // This isn't a regular constructor so add the type chain manually
        Object.setPrototypeOf(r, AbortablePromise.prototype);

        // type check
        const ap : AbortablePromise<T> = r;

        return ap;
    }
}