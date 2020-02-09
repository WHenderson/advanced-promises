export interface OnAbortCallback {
    () : void | PromiseLike<void>;
}

export type OnAbortHandle = unknown | PromiseLike<unknown>;

export interface OnAbort {
    (cb: OnAbortCallback) : OnAbortHandle;
    remove: (handle: OnAbortHandle) => void;
    isAborted: boolean;
    withHandler: <T> (callback: (onAbort: OnAbort) => PromiseLike<T>, handler: OnAbortCallback) => PromiseLike<T>
}