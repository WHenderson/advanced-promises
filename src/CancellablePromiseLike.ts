import {AbortApi} from "./AbortApi";

export interface CancellablePromiseLike<T> extends Promise<T> {
    cancel() : void | CancellablePromiseLike<T>;

    // Add a default onAbort handler which will cancel the promise
    withAutoCancel(aapi: AbortApi) : CancellablePromiseLike<T>;
}