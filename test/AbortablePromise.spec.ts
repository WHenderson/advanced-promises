import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {AbortablePromise} from "../src/AbortablePromise";
import {CancellableTimeout} from "../src/CancellableTimeout";

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;

describe('AbortablePromise', () => {
    it('resolve', async () => {
        const value = {};
        const apromise = new AbortablePromise((resolve, reject, onAbort) => {
            resolve(value);
        });

        await expect(apromise).to.eventually.equal(value);
    });

    it('reject', async () => {
        const value = new Error();
        const apromise = new AbortablePromise((resolve, reject, onAbort) => {
            reject(value);
        });

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });

    it('abort with resolve', async () => {
        const value = { value: 'a' };
        let aborted = false;
        const apromise = new AbortablePromise((resolve, reject, onAbort) => {
            const timeout = new CancellableTimeout(1000);
            timeout.then(() => { resolve(value )});
            onAbort(() => {
                timeout.cancel();
                aborted = true;
            });
        });

        const abortValue = { value: 'b' };
        apromise.abortWith({ resolve: abortValue });

        await expect(apromise).to.eventually.equal(abortValue);
        expect(aborted).to.be.true;
    });

    it('abort with reject', async () => {
        const value = { value: 'a' };
        let aborted = false;
        const apromise = new AbortablePromise((resolve, reject, onAbort) => {
            const timeout = new CancellableTimeout(1000);
            timeout.then(() => { resolve(value )});
            onAbort(() => {
                timeout.cancel();
                aborted = true;
            });
        });

        const abortValue = new Error('abort');
        apromise.abortWith({ reject: abortValue });

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(abortValue);
        expect(aborted).to.be.true;
    });

    it('correct prototype', () => {
        const apromise = new AbortablePromise(() => {});

        expect(apromise).to.be.an.instanceOf(AbortablePromise);

        const promise = apromise.then(() => {});

        expect(promise).to.not.be.an.instanceOf(AbortablePromise);
        expect(promise).to.be.an.instanceOf(Promise);
    });

    it('async resolve', async () => {
        const value = {};
        const apromise = AbortablePromise.fromAsync(async () => value);

        await expect(apromise).to.eventually.equal(value);
    });

    it('async reject', async () => {
        const value = new Error();
        const apromise = AbortablePromise.fromAsync(async () => { throw value; });

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });

    it('promise resolve', async () => {
        const value = {};
        const promise = Promise.resolve(value);
        const apromise = AbortablePromise.fromPromise(promise);

        await expect(apromise).to.eventually.equal(value);
    });

    it('promise reject', async () => {
        const value = new Error();
        const promise = Promise.reject(value);
        const apromise = AbortablePromise.fromPromise(promise);

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });
});