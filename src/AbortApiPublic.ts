import {ABORT_STATE, AbortApi} from "./AbortApi"
import { AbortApiInternal } from "./AbortApiInternal";

export interface AbortApiPublic extends AbortApi {
    abort(): PromiseLike<void>;
}

export class AbortApiPublic extends AbortApi implements AbortApiPublic {
    public abort: () => PromiseLike<void>;

    // @ts-ignore
    constructor() {
        const iapi = new AbortApiInternal();

        const obj = iapi.aapi as any;

        obj.abort = () => iapi.abort();

        Object.setPrototypeOf(obj, AbortApiPublic.prototype);

        return obj;
    }
}