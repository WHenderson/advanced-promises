export interface OnAbortCallback {
    () : void | PromiseLike<void>;
}

export interface OnAbort {
    (cb: OnAbortCallback) : OnAbortCallback;
    remove: (cb: OnAbortCallback) => void;
    isAborted: boolean;
    withHandler: <T> (callback: (onAbort: OnAbort) => PromiseLike<T>, handler: OnAbortCallback) => PromiseLike<T>
}