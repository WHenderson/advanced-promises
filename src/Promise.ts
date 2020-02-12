export interface Executor<T> {
    (resolve : (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) : void
}

export interface ResponseResolve<T> {
    resolve: T;
}
export interface ResponseReject {
    reject: any;
}
export type Response<T> = ResponseResolve<T> | ResponseReject;