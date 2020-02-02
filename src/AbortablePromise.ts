import {OnAbort, OnAbortCallback, OnAbortHandle} from "./OnAbort";
import {CancellablePromise} from "./CancellablePromise";
import {CancellableTimeout, Response} from "./CancellableTimeout";

interface AbortablePromiseExecutor<T> {
    (resolve : (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, onAbort: OnAbort) : void
}

export interface AbortablePromise<T> extends Promise<T> {
    // Will result in the promise resolving with the given value
    abortWithResolve: (value?: T | PromiseLike<T>) => PromiseLike<void>;

    // Will result in the promise rejecting with the given value
    abortWithReject: (reason?: any) => PromiseLike<void>;

    // Abort with either a resolve or a reject
    abort: (response?: Response<T>) => PromiseLike<void>;
}

export class AbortablePromise<T> extends Promise<T> implements AbortablePromise<T> {
    public abortWithResolve: (value?: T | PromiseLike<T>) => PromiseLike<void>;
    public abortWithReject: (reason?: any) => PromiseLike<void>;
    public abort: (response?: Response<T>) => PromiseLike<void>;

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


    public withTimeout(timeout: CancellableTimeout<T>) : AbortablePromise<T>;
    public withTimeout(duration: number, response?: Response<T>) : AbortablePromise<T>;
    public withTimeout(timeout: number | CancellableTimeout<T>, response?: Response<T>) : AbortablePromise<T> {
        if (typeof timeout === 'number')
            timeout = new CancellableTimeout<T>(timeout, response);

        const waitTimeout = timeout;

        return AbortablePromise.fromAsync<T>(async (onAbort) => {
            return onAbort.withHandler(
                async () => {
                    return Promise.race([
                        waitTimeout
                            .then(async x => {
                                await this.abort(response);
                                return x;
                            }),
                        this
                    ]);
                },
                async () => {
                    waitTimeout.cancel();
                    await this.abort(response);
                }
            );
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
            const p = onAbortApi.isAborted
                ? Promise.resolve().then(() => cb()).then(() => cb)
                : cb;
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
            const handle = await onAbortApi(handler);
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
        r.abort = async (response?: Response<T>) => {
            if (isAborted)
                throw new Error('AbortablePromise already aborted');
            if (isResolved)
                throw new Error('AbortablePromise already resolved');

            if (response && 'resolve' in response)
                res(response.resolve);
            else if (response && 'reject' in response)
                rej(response.reject);
            else
                res();

            isAborted = true;
            await handlers.reduce(async (current, next) => {
                await current;
                const [cb,] = next;
                await cb();
            }, Promise.resolve());
        };
        r.abortWithResolve = async (value?: T | PromiseLike<T>) => {
            return r.abort({ resolve: value });
        };
        r.abortWithReject = async (reason?: any) => {
            return r.abort({ reject: reason });
        };

        // This isn't a regular constructor so add the type chain manually
        Object.setPrototypeOf(r, AbortablePromise.prototype);

        // type check
        const ap : AbortablePromise<T> = r;

        return ap;
    }
}