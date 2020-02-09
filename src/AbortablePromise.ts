import {OnAbort, OnAbortCallback, OnAbortHandle} from "./OnAbort";
import {CancellablePromise} from "./CancellablePromise";
import {CancellableTimeout, Response} from "./CancellableTimeout";

interface AbortablePromiseExecutor<T> {
    (resolve : (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, onAbort: OnAbort) : void
}

export interface AbortablePromise<T> extends Promise<T> {
    // Abort with either a resolve or a reject. Returns this.
    abortWith: (response?: Response<T>) => AbortablePromise<T>;

    // The original promise which is wrapped with an abort
    promise: PromiseLike<T>;

    // The promise used as an abort in the promise/abort race
    abort: PromiseLike<T>;
}

export class AbortablePromise<T> extends Promise<T> implements AbortablePromise<T> {
    public abortWith: (response?: Response<T>) => AbortablePromise<T>;

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

    static fromPromise<T>(promise : T | PromiseLike<T>) : AbortablePromise<T> {
        return new AbortablePromise<T>((resolve, reject, onAbort) => {
            Promise.resolve(promise).then(resolve, reject);
        });
    }


    public withTimeout(timeout: CancellableTimeout<T>) : AbortablePromise<T>;
    public withTimeout(duration: number, response?: Response<T>) : AbortablePromise<T>;
    public withTimeout(timeout: number | CancellableTimeout<T>, response?: Response<T>) : AbortablePromise<T> & { timeout?: CancellableTimeout<T>} {
        if (!timeout)
            return this;
        if (typeof timeout === 'number')
            timeout = new CancellableTimeout<T>(timeout, response);

        const waitTimeout = timeout;

        const a = AbortablePromise.fromAsync<T>( (onAbort) => {
            return onAbort.withHandler(
                async () => {
                    return Promise.race([
                        waitTimeout
                            .finally(async () => {
                                await this.abortWith(response)
                            }),
                        this
                            .finally(() =>  {
                                waitTimeout.cancel()
                            })
                    ]);
                },
                async () => {
                    waitTimeout.cancel();
                    await this.abortWith(response);
                }
            );
        }) as (AbortablePromise<T> & { timeout: CancellableTimeout<T> });

        a.timeout = waitTimeout;
        return a;
    }

    // @ts-ignore
    constructor(executor: AbortablePromiseExecutor<T>) {
        // handlers
        const handlers = [];
        let isAborted = false;
        let isResolved = false;

        // create the callee abortWith api
        const onAbortApi = (cb: OnAbortCallback) : unknown | PromiseLike<unknown> => {
            const p = onAbortApi.isAborted
                ? Promise.resolve().then(() => cb()).then(() => cb) // execute and resolve to handle
                : cb;
            handlers.push([cb, p]);
            return p;
        };
        onAbortApi.remove = (handle: OnAbortHandle) => {
            handlers.splice(handlers.findIndex(val => (val[0] === handle || val[1] === handle)), 1);
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
        const p = new Promise<T>((resolve, reject) => executor.call(undefined, resolve, reject, onAbort));

        const pfinally = p
            .finally(() => {
                isResolved = true;
            });

        // create the aborting promise
        let res;
        let rej;
        const a = new Promise<T>((resolve, reject) => {
            res = resolve;
            rej = reject;
        });
        const afinally = a
            .finally(async () => {
            isAborted = true;
            if (isResolved)
                return;

            await handlers.reduce(async (current, next) => {
                await current;
                const [cb,p] = next;
                await (p === cb)
                    ? cb()
                    : p;
            }, Promise.resolve());
        });

        // create the race
        const r = Promise
            .race([a, p])
            .finally(() => Promise.race([afinally, pfinally])) as AbortablePromise<T>;

        // create the caller abortWith api
        r.abortWith = (response?: Response<T>) => {
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

            return r;
        };
        r.abort = afinally;
        r.promise = pfinally;

        // This isn't a regular constructor so add the type chain manually
        Object.setPrototypeOf(r, AbortablePromise.prototype);

        return r;
    }
}