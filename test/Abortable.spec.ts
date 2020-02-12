import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Abortable} from "../src/Abortable";
import {Timeout} from "../src/Timeout";

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;

describe('AbortablePromise', () => {
    it('resolve', async () => {
        const value = {};
        const apromise = new Abortable((resolve, reject, aapi) => {
            resolve(value);
        });

        await expect(apromise).to.eventually.equal(value);
    });

    it('reject', async () => {
        const value = new Error();
        const apromise = new Abortable((resolve, reject, aapi) => {
            reject(value);
        });

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });

    it('abort with resolve', async () => {
        const value = { value: 'a' };
        let aborted = false;
        const apromise = new Abortable((resolve, reject, aapi) => {
            const timeout = new Timeout(1000);
            timeout.then(() => { resolve(value )});
            aapi.on(() => {
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
        const apromise = new Abortable((resolve, reject, aapi) => {
            const timeout = new Timeout(1000);
            timeout.then(() => { resolve(value )});
            aapi.on(() => {
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
        const apromise = new Abortable(() => {});

        expect(apromise).to.be.an.instanceOf(Abortable);

        const promise = apromise.then(() => {});

        expect(promise).to.not.be.an.instanceOf(Abortable);
        expect(promise).to.be.an.instanceOf(Promise);
    });

    it('async resolve', async () => {
        const value = {};
        const apromise = Abortable.fromAsync(async () => value);

        await expect(apromise).to.eventually.equal(value);
    });

    it('async reject', async () => {
        const value = new Error();
        const apromise = Abortable.fromAsync(async () => { throw value; });

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });

    it('promise resolve', async () => {
        const value = {};
        const promise = Promise.resolve(value);
        const apromise = Abortable.fromPromise(promise);

        await expect(apromise).to.eventually.equal(value);
    });

    it('promise reject', async () => {
        const value = new Error();
        const promise = Promise.reject(value);
        const apromise = Abortable.fromPromise(promise);

        await expect(apromise).to.eventually.be.rejectedWith(Error).and.equal(value);
    });
});