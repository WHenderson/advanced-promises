export interface Executor<T> {
    (resolve : (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) : void
}
