import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Abortable} from "../src/Abortable";
import {Timeout} from "../src/Timeout";

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;

describe('AbortablePromise.withTimeout', () => {
    it('over time', async () => {
        let abortedEarly = false;
        let abortedLate = false;
        const TIMEOUT = { v: 'timeout' };
        const COMPLETE = { v: 'complete' };

        const apromise = Abortable.fromAsync(async (aapi) => {
            // test abort
            await aapi.on(() => {
                abortedEarly = true;
            });

            // wait long enough to cause timeout
            await new Timeout(50);

            // test abort
            await aapi.on(() => {
                abortedLate = true;
            });

            return COMPLETE;
        });

        // Add a timeout to the abortable promise
        const tpromise = apromise.withTimeout(10, { resolve: TIMEOUT });

        // Get the response
        const response = await tpromise;

        expect(response).to.equal(TIMEOUT);
        expect(abortedEarly).to.be.true;

        await new Timeout(50);

        expect(abortedLate).to.be.true;
    });

    it('under time', async () => {
        let abortedEarly = false;
        let abortedLate = false;
        const TIMEOUT = { v: 'timeout' };
        const COMPLETE = { v: 'complete' };

        const apromise = Abortable.fromAsync(async (aapi) => {
            // test abort
            await aapi.on(() => {
                abortedEarly = true;
            });

            // wait long enough to cause timeout
            await new Timeout(10);

            // test abort
            await aapi.on(() => {
                abortedLate = true;
            });

            return COMPLETE;
        });

        // Add a timeout to the abortable promise
        const tpromise = apromise.withTimeout(50, { resolve: TIMEOUT });

        // Get the response
        const response = await tpromise;

        expect(response).to.equal(COMPLETE);
        expect(abortedEarly).to.be.false;
        expect(abortedLate).to.be.false;
    });
});