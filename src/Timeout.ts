import { ResponseReject, ResponseResolve, Response } from './Promise';
import { CancellablePromiseLike } from './CancellablePromiseLike';
import { AbortablePromiseLike } from './AbortablePromiseLike';
import { AbortApi } from './AbortApi';
import { AbortApiInternal } from './AbortApiInternal';

function isResponseResolve<T>(response: Response<T>): response is ResponseResolve<T> {
  return response && {}.hasOwnProperty.call(response, 'resolve');
}
function isResponseReject<T>(response: ResponseReject): response is ResponseReject {
  return response && {}.hasOwnProperty.call(response, 'reject');
}

export class Timeout<T> extends Promise<T> implements CancellablePromiseLike<T>, AbortablePromiseLike<T> {
  public abortWith: (response?: Response<T>) => this;
  public promise: PromiseLike<T>;
  public abort: PromiseLike<T>;
  public aapi: AbortApi;

  public cancel: () => void;

  // Handle internal usage in .then etc
  static get [Symbol.species]() {
    return Promise;
  }

  public withAutoCancel(aapi: AbortApi): this {
    aapi.on(() => this.cancel());
    return this;
  }
  public withAutoAbort(aapi: AbortApi, response?: Response<T>): this {
    aapi.on(() => {
      this.abortWith(response);
    });
    return this;
  }

  constructor(duration: number, response?: Response<T>) {
    // Create base promise
    let resolve;
    let reject;
    super((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Create Abort Api
    const iapi = new AbortApiInternal();

    // Create timeout
    let id = setTimeout(() => {
      id = undefined;
      if (isResponseResolve(response)) resolve(response.resolve);
      else if (isResponseReject(response)) reject(response.reject);
      else resolve();
    }, duration);

    // Create cancel interface
    this.cancel = () => {
      if (id) {
        clearTimeout(id);
        id = undefined;
      }
    };

    this.abortWith = (response?: Response<T>): this => {
      if (response && 'resolve' in response) resolve(response.resolve);
      else if (response && 'reject' in response) reject(response.reject);
      else resolve();

      return this;
    };
  }
}
