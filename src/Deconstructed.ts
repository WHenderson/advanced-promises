import {DeconstructedPromiseLike} from "./DeconstructedPromiseLike";

export class Deconstructed<T> extends Promise<T> implements DeconstructedPromiseLike<T> {
    public resolve: (value?: T | PromiseLike<T>) => void;
    public reject: (reason?: any) => void;

    static get [Symbol.species]() {
        return Promise;
    }

    constructor() {
        let res = undefined;
        let rej = undefined;
        super((resolve, reject) => {
           res = resolve;
           rej = reject;
        });
        this.resolve = res;
        this.reject = rej;
    }
}