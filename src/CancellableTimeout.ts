import {CancellablePromise} from "./CancellablePromise";
import {OnAbort} from "./OnAbort";

interface ResponseResolve<T> {
    resolve: T;
}
interface ResponseReject {
    reject: any;
}
export type Response<T> = ResponseResolve<T> | ResponseReject;

function isResponseResolve<T>(response: Response<T>) : response is ResponseResolve<T> {
    return (response && {}.hasOwnProperty.call(response, 'resolve'));
}
function isResponseReject<T>(response: ResponseReject) : response is ResponseReject {
    return (response && {}.hasOwnProperty.call(response, 'reject'));
}

export class CancellableTimeout<T> extends Promise<T> implements CancellablePromise<T> {
    public cancel: () => void;

    // Handle internal usage in .then etc
    static get [Symbol.species]()
    {
        return Promise;
    }

    public withAutoCancel(onAbort: OnAbort) : CancellablePromise<T> {
        onAbort(() => this.cancel());
        return this;
    }

    constructor(duration: number, response?: Response<T>) {
        // Create base promise
        let resolve, reject;
        super((res, rej) => {
            resolve = res;
            reject = rej;
        });

        // Create timeout
        let id = setTimeout(() => {
            id = undefined;
            if (isResponseResolve(response))
                resolve(response.resolve);
            else if (isResponseReject(response))
                reject(response.reject);
            else
                resolve();
        }, duration);

        // Create cancel interface
        this.cancel = () => {
            if (id) {
                clearTimeout(id);
                id = undefined;
            }
        }
    }
}