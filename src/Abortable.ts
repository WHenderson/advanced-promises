import { ABORT_STATE, AbortApi } from './AbortApi';
import { AbortApiInternal } from './AbortApiInternal';
import { Response } from './Promise';
import { Timeout } from './Timeout';
import { AbortablePromiseLike, AbortablePromiseExecutor } from './AbortablePromiseLike';
import {Deconstructed} from "./Deconstructed";

export class Abortable<T> extends Promise<T> implements AbortablePromiseLike<T> {
  public abortWith: (response?: Response<T>) => this;
  public promise: Promise<T>;
  public abort: Promise<T>;
  public timeout?: Timeout<T>;
  public aapi: AbortApi;

  // Handle internal usage in .then etc
  static get [Symbol.species]() {
    return Promise;
  }

  static fromAsync<T>(executor: (aapi: AbortApi) => T | PromiseLike<T>): Abortable<T> {
    return new Abortable<T>((resolve, reject, aapi) => {
      try {
        resolve(executor(aapi));
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
    const waitTimeout = (typeof timeout === 'number') ? new Timeout<T>(timeout) : timeout;

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
    const a = new Deconstructed<T>();
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
      if (iapi.state !== ABORT_STATE.NONE || isResolved)
        return r;

      if (response && 'resolve' in response) a.resolve(response.resolve);
      else if (response && 'reject' in response) a.reject(response.reject);
      else a.resolve();

      return r;
    };
    r.abort = afinally;
    r.promise = pfinally;
    r.aapi = iapi.aapi;

    // This isn't a regular constructor so add the type chain manually
    Object.setPrototypeOf(r, Abortable.prototype);

    return r;
  }

  static resolve() : Abortable<void>;
  static resolve<T>(value?: T | PromiseLike<T>) : Abortable<T> {
    return new Abortable<T>((resolve) => resolve(value));
  }

  static reject<T = never>(reason?: any) : Abortable<T> {
    return new Abortable<T>((resolve, reject) => reject(reason));
  }
}
