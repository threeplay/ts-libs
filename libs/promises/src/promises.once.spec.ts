import {Promises} from './promises';

describe('Promises.once', () => {
   it('should invoke method only once', async () => {
       let invoked = 0;
       const fn = Promises.once(async () => { ++invoked; });

       expect(invoked).to.equal(0);
       await fn();
       expect(invoked).to.equal(1);
       await fn();
       await fn();
       expect(invoked).to.equal(1);
   });

   it('should keep reject result', async () => {
       let invoked = 0;
       const fn = Promises.once(async () => { throw Error(`rejected: ${invoked++}`) });

       await expect(fn()).to.eventually.be.rejectedWith('rejected: 0');
       await expect(fn()).to.eventually.be.rejectedWith('rejected: 0');
       await expect(fn()).to.eventually.be.rejectedWith('rejected: 0');
       await expect(fn()).to.eventually.be.rejectedWith('rejected: 0');
   });
});
