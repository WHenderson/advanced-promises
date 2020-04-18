import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as cprocess from 'child_process';
import * as path from 'path';
import {Process} from "../src/Process";
import {Timeout} from "../src/Timeout";

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;

describe('Process', function () {
    this.timeout(10000);


    it('normal exit', async () => {
        const response = await new Process(cprocess.fork(
            path.join(__dirname, 'abortable-process', 'simple-process.js'),
            [],
            {
                env: Object.assign({}, process.env, {
                    MY_DURATION: '10',
                    MY_EXIT: '0'
                })
            }
        ));

        expect(response).to.be.ok;
        expect(response.code).to.be.equal(0);
        expect(response.signal).to.be.null;
    });

    it('fail exit', async () => {
        const response = await new Process(cprocess.fork(
            path.join(__dirname, 'abortable-process', 'simple-process.js'),
            [],
            {
                env: Object.assign({}, process.env, {
                    MY_DURATION: '10',
                    MY_EXIT: '1'
                })
            }
        ));

        expect(response).to.be.ok;
        expect(response.code).to.be.equal(1);
        expect(response.signal).to.be.null;
    });

    it('abort', async () => {
        const wait = new Process(cprocess.fork(
            path.join(__dirname, 'abortable-process', 'simple-process.js'),
            [],
            {
                env: Object.assign({}, process.env, {
                    MY_DURATION: '100',
                    MY_EXIT: '-1'
                })
            }
        ));

        await new Timeout(20);

        const EX_ABORT = new Error('abort');

        wait.abortWith({reject: EX_ABORT});

        await expect(wait).to.eventually.be.rejectedWith(EX_ABORT);

        const response = await wait.promise;

        expect(response).to.be.ok;
        expect(response.code).to.be.null;
        expect(response.signal).to.be.equal('SIGTERM');
    });

    it('timeout', async () => {
        const EX_TIMEOUT = new Error('timeout');

        const wait = new Process(cprocess.fork(
            path.join(__dirname, 'abortable-process', 'simple-process.js'),
            [],
            {
                env: Object.assign({}, process.env, {
                    MY_DURATION: '200',
                    MY_EXIT: '-1'
                })
            }
        )).withTimeout(100, { reject: EX_TIMEOUT });

        await new Timeout(20);

        await expect(wait).to.eventually.be.rejectedWith(EX_TIMEOUT);

        const response = await wait.promise;

        expect(response).to.be.ok;
        expect(response.code).to.be.null;
        expect(response.signal).to.be.equal('SIGTERM');
    });
});
