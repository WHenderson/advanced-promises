import { ResponseReject, ResponseResolve, Response } from './Promise';
import { CancellablePromiseLike } from './CancellablePromiseLike';
import { AbortablePromiseLike } from './AbortablePromiseLike';
import {ABORT_STATE, AbortApi} from './AbortApi';
import { AbortApiInternal } from './AbortApiInternal';

function isResponseResolve<T>(response: Response<T>): response is ResponseResolve<T> {
  return response && {}.hasOwnProperty.call(response, 'resolve');
}
function isResponseReject<T>(response: ResponseReject): response is ResponseReject {
  return response && {}.hasOwnProperty.call(response, 'reject');
}

const INF = {};
const NUL = {};

export class Timeout<T> extends Promise<T> implements CancellablePromiseLike<T>, AbortablePromiseLike<T> {
  public abortWith: (response?: Response<T>) => this;
  public promise: PromiseLike<T>;
  public abort: PromiseLike<T>;
  public aapi: AbortApi;
  public timeoutId: NodeJS.Timeout;
  public reset: (duration: number) => this;

  //public cancel: () => void;

  // Handle internal usage in .then etc
  static get [Symbol.species]() {
    return Promise;
  }

  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  public withAutoCancel(aapi: AbortApi): this {
    aapi.on(() => this.cancel());
    return this;
  }
  public withAutoAbort(aapi: AbortApi, response?: Response<T>): this {
    aapi.on(() => {
      this.abortWith(response);
      this.cancel();
    });
    return this;
  }

  constructor(duration: number, response?: Response<T>) {
    // Create Abort Api
    const iapi = new AbortApiInternal(duration === NUL ? ABORT_STATE.ABORTED : ABORT_STATE.NONE);

    // Create base promise
    let resolve;
    let reject;
    super((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Create timeout
    this.timeoutId = undefined;

    const onTimeout = () => {
      this.timeoutId = undefined;
      if (isResponseResolve(response)) resolve(response.resolve);
      else if (isResponseReject(response)) reject(response.reject);
      else resolve();
    };

    this.reset = (duration: number) => {
      if (this.timeoutId)
        clearTimeout(this.timeoutId);

      if (duration === NUL) {
        onTimeout();
      }
      else if (duration !== INF) {
        this.timeoutId = setTimeout(onTimeout, duration);
      }

      return this;
    };

    this.reset(duration);

    this.abortWith = (response?: Response<T>): this => {
      this.cancel();

      iapi
          .abort()
          .then(() => {
            if (response && 'resolve' in response) resolve(response.resolve);
            else if (response && 'reject' in response) reject(response.reject);
            else resolve();
          });

      return this;
    };

    this.aapi = iapi.aapi;
  }

  static resolve() : Timeout<void>;
  static resolve<T>(value?: T | PromiseLike<T>) : Timeout<T> {
    return new Timeout<T>(NUL as number, { resolve: value });
  }

  static reject<T = never>(reason?: any) : Timeout<T> {
    return new Timeout<T>(NUL as number, { reject: reason });
  }

  static infinite() : Timeout<void>;
  static infinite<T>(value?: T | PromiseLike<T>) : Timeout<T> {
    return new Timeout<T>(INF as number, { resolve: value });
  }
}
