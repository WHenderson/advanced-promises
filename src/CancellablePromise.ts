import {OnAbort} from "./OnAbort";

export interface CancellablePromise<T> extends Promise<T> {
    cancel: () => void;

    // Add a default onAbort handler which will cancel the promise
    withAutoCancel(onAbort: OnAbort) : CancellablePromise<T>;
}