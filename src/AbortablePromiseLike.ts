import { AbortApi } from './AbortApi';
import { Response } from './Promise';

export type AbortablePromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
  aapi: AbortApi,
) => void;

export interface AbortablePromiseLike<T> extends Promise<T> {
  // Abort with either a resolve or a reject. Returns this.
  abortWith(response?: Response<T>): this;

  // API for handlers
  aapi: AbortApi;

  // Add a default onAbort handler which will abortWith response
  withAutoAbort(aapi: AbortApi, response?: Response<T>): this;
}
