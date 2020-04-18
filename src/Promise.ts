export type Executor<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;

export interface ResponseResolve<T> {
  resolve: T | PromiseLike<T>;
}
export interface ResponseReject {
  reject: any;
}
export type Response<T> = ResponseResolve<T> | ResponseReject;
