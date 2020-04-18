import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {Timeout} from "../src/Timeout";

chai.use(chaiAsPromised);
const should = chai.should;
const expect = chai.expect;


describe('Timeout', () => {
   it('duration 100ms', async () => {
      const duration = 100;
      const errorMargin = 20;

      const startTime = +new Date();
      await new Timeout(duration);
      const endTime = +new Date();

      expect(endTime - startTime).to.be.gt(duration - errorMargin);
      expect(endTime - startTime).to.be.lt(duration + errorMargin);
   });

   it('response resolve', async () => {
      const value = {};
      const result = await new Timeout(1, { resolve: value });
      expect(result).to.equal(value);
   });

   it('response reject', async () => {
      const value = new Error('reject');
      const promise = new Timeout(1, { reject: value });
      await expect(promise).to.eventually.be.rejectedWith(Error).and.equal(value);
   });

   it('early cancel', async () => {
      const promiseA = new Timeout(20, { resolve: 'a'});
      const promiseB = new Timeout(40, { resolve: 'b'});

      promiseA.cancel();

      const race = Promise.race([promiseA, promiseB]);

      await expect(race).to.eventually.equal('b');
   });

   it('late cancel', async () => {
      const promiseA = new Timeout(40, { resolve: 'a'});
      const promiseB = new Timeout(60, { resolve: 'b'});
      const promiseC = new Timeout(20);
      promiseC.then(() => promiseA.cancel());

      const race = Promise.race([promiseA, promiseB]);

      await expect(race).to.eventually.equal('b');
   });

   it('correct prototype', () => {
      const tpromise = new Timeout(10);
      tpromise.cancel();

      expect(tpromise).to.be.an.instanceOf(Timeout);

      const promise = tpromise.then(() => {/* ignore */});

      expect(promise).to.not.be.an.instanceOf(Timeout);
      expect(promise).to.be.an.instanceOf(Promise);
   });
});