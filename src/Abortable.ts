import { ABORT_STATE, AbortApi, AbortApiInternal } from './AbortApi';
import { Response } from './Promise';
import { Timeout } from './Timeout';
import { AbortablePromiseLike, AbortablePromiseExecutor } from './AbortablePromiseLike';

export class Abortable<T> extends Promise<T> implements AbortablePromiseLike<T> {
  public abortWith: (response?: Response<T>) => this;
  public promise: PromiseLike<T>;
  public abort: PromiseLike<T>;
  public timeout?: Timeout<T>;
  public aapi: AbortApi;

  // Handle internal usage in .then etc
  static get [Symbol.species]() {
    return Promise;
  }

  static fromAsync<T>(executor: (aapi: AbortApi) => T | PromiseLike<T>): Abortable<T> {
    return new Abortable<T>((resolve, reject, onAbort) => {
      try {
        resolve(executor(onAbort));
      } catch (ex) {
        reject(ex);
      }
    });
  }

  static fromPromise<T>(promise: T | PromiseLike<T>): Abortable<T> {
    return new Abortable<T>((resolve, reject) => {
      Promise.resolve(promise).then(resolve, reject);
    });
  }

  public withTimeout(timeout: Timeout<T>): Abortable<T>;
  public withTimeout(duration: number, response?: Response<T>): Abortable<T>;
  public withTimeout(timeout: number | Timeout<T>, response?: Response<T>): Abortable<T> {
    if (!timeout) return this;
    if (typeof timeout === 'number') timeout = new Timeout<T>(timeout);

    const waitTimeout = timeout;

    this.aapi.on(() => waitTimeout.cancel());

    this.finally(() => {
      waitTimeout.cancel();
    }).catch(() => {
      /* swallow errors */
    });

    waitTimeout
      .finally(() => {
        this.abortWith(response);
      })
      .catch(() => {
        /* swallow errors */
      });

    this.timeout = waitTimeout;
    return this;
  }

  public withAutoAbort(aapi: AbortApi, response?: Response<T>): this {
    aapi.on(() => {
      this.abortWith(response);
    });
    return this;
  }

  // @ts-ignore
  constructor(executor: AbortablePromiseExecutor<T>) {
    // handlers
    const iapi = new AbortApiInternal();

    let isResolved = false;

    // create the user promise
    const p = new Promise<T>((resolve, reject) => executor.call(undefined, resolve, reject, iapi.aapi));

    const pfinally = p.finally(() => {
      isResolved = true;
    });

    // create the aborting promise
    let res;
    let rej;
    const a = new Promise<T>((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    const afinally = a.finally(async () => {
      if (isResolved) return;

      await iapi.abort();
    });

    // create the race
    // Note:
    //   We race the raw promises without their finally states to ensure we don't affect the outcome of the race
    //   We then race the finally states to ensure they are complete before resolving for the user
    const r = Promise.race([a, p]).finally(() =>
      Promise.race([
        afinally.catch(() => {
          /* swallow errors */
        }),
        pfinally.catch(() => {
          /* swallow errors */
        }),
      ]),
    ) as Abortable<T>; // ensure

    // create the caller abortWith api
    r.abortWith = (response?: Response<T>) => {
      if (iapi.state !== ABORT_STATE.NONE) throw new Error('AbortablePromise already aborted/aborting');
      if (isResolved) throw new Error('AbortablePromise already resolved');

      if (response && 'resolve' in response) res(response.resolve);
      else if (response && 'reject' in response) rej(response.reject);
      else res();

      return r;
    };
    r.abort = afinally;
    r.promise = pfinally;
    r.aapi = iapi.aapi;

    // This isn't a regular constructor so add the type chain manually
    Object.setPrototypeOf(r, Abortable.prototype);

    return r;
  }
}
