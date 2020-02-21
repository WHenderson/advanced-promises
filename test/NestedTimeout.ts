import {Abortable} from "../src/Abortable";
import {Timeout} from "../src/Timeout";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;


describe('NestedTimeout', () => {

    const EX_ABORT_INNER = new Error('abort inner');
    const EX_TIMEOUT_INNER = new Error('timeout inner');
    const EX_TIMEOUT_OUTER = new Error('timeout outer');
    const SUCCESS = {};

    function nest({ outerTimeout, innerTimeout, processTimeout }) {
        const waitOuter = Abortable.fromAsync(async (aapi) => {
            //await Promise.resolve();

            //console.log('> outer');

            const waitInner = Abortable.fromAsync(async (aapi) => {
                await Promise.resolve();

                //console.log('> inner');

                await new Timeout(processTimeout).withAutoCancel(aapi);

                //console.log('< inner');
                return SUCCESS;
            }).withTimeout(innerTimeout, { reject: EX_TIMEOUT_INNER}).withAutoAbort(aapi, { reject: EX_ABORT_INNER });

            try {
                return await waitInner;
            }
            catch (ex) {
                //console.log('inner ex', ex);
                throw ex;
            }
            finally {
                //console.log('< outer');
            }
        }).withTimeout(outerTimeout, { reject: EX_TIMEOUT_OUTER});

        return waitOuter;
    }

    it('no abort', async () => {
        const wait = nest({outerTimeout: 200, innerTimeout: 100, processTimeout: 50 });
        await expect(wait).to.eventually.equal(SUCCESS);
    });

    it('abort inner', async () => {
        const wait = nest({outerTimeout: 200, innerTimeout: 50, processTimeout: 100 });
        await expect(wait).to.eventually.be.rejectedWith(EX_TIMEOUT_INNER);
    });

    it('abort out', async () => {
        const wait = nest({outerTimeout: 50, innerTimeout: 100, processTimeout: 50 });
        await expect(wait).to.eventually.be.rejectedWith(EX_TIMEOUT_OUTER);
    });

    it('abort both', async () => {
        const wait = nest({outerTimeout: 50, innerTimeout: 100, processTimeout: 200 });
        await expect(wait).to.eventually.be.rejectedWith(EX_TIMEOUT_OUTER);
        await expect(wait.promise).to.eventually.be.rejectedWith(EX_ABORT_INNER);
    });

});
