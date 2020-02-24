import { ABORT_STATE, AbortApi, AbortApiInternal as AbortApiInternalInterface, OnAbortCallback } from './AbortApi';

export class AbortApiInternal implements AbortApiInternalInterface {
  public handlers: [OnAbortCallback, OnAbortCallback | PromiseLike<OnAbortCallback>][];
  public state: ABORT_STATE;
  public aapi: AbortApi;

  constructor() {
    this.handlers = [];
    this.state = ABORT_STATE.NONE;
    this.aapi = new AbortApi(this);
  }

  async abort(): Promise<void> {
    if (this.state !== ABORT_STATE.NONE) return;

    this.state = ABORT_STATE.ABORTING;

    await this.handlers.reduce(async (current, next) => {
      await current;
      const [cb, p] = next;
      await (p === cb ? cb() : p);
    }, Promise.resolve());

    this.state = ABORT_STATE.ABORTED;
  }
}
