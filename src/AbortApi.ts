export type OnAbortCallback = () => void | PromiseLike<void>;

export type OnAbortHandle = unknown | PromiseLike<unknown>;

export enum ABORT_STATE {
  NONE,
  ABORTING,
  ABORTED,
}

export interface AbortApi {
  on(cb: OnAbortCallback): OnAbortHandle;
  off(handle: OnAbortHandle, ignoreNotFound?: boolean): void;

  readonly state: ABORT_STATE;

  withHandler<T>(callback: (aapi: AbortApi) => T | PromiseLike<T>, handler: OnAbortCallback): PromiseLike<T>;
}

export interface AbortApiInternal {
  aapi: AbortApi;
  state: ABORT_STATE;
  handlers: [OnAbortCallback, OnAbortCallback | PromiseLike<OnAbortCallback>][];

  abort(): PromiseLike<void>;
}

export class AbortApi implements AbortApi {
  public on: (cb: OnAbortCallback) => OnAbortHandle;
  public off: (handle: OnAbortHandle, ignoreNotFound?: boolean) => void;

  constructor(internal: AbortApiInternal) {
    this.on = function on(cb: OnAbortCallback): unknown | PromiseLike<unknown> {
      // * returns a handle which can later be removed
      // * waiting on the handle will also return a handle that can be removed
      // * if the state is aborting, then the handler will be called immediately

      const p = internal.state !== ABORT_STATE.NONE ? Promise.resolve(cb()).then(() => cb) : cb;
      internal.handlers.push([cb, p]);
      return p;
    };

    this.off = function off(handle: OnAbortHandle, ignoreNotFound: boolean = true): void {
      const index = internal.handlers.findIndex(([cb, p]) => cb === handle || p === handle);
      if (index !== -1) internal.handlers.splice(index, 1);
      else if (!ignoreNotFound) throw new Error('handle not found');
    };

    Object.defineProperty(this, 'state', {
      get: () => internal.state,
    });
  }

  async withHandler<T>(callback: (aapi: AbortApi) => T | PromiseLike<T>, handler: OnAbortCallback): Promise<T> {
    const handle = await this.on(handler);
    try {
      return await callback(this);
    } finally {
      this.off(handle);
    }
  }
}
