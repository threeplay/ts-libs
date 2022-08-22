import {Promises} from './promises';
import {sleep} from './sleep';

describe('Promises.serialize', () => {
   it('should serialize invocations', async () => {
       let invoked: { idx: number, start: number, end: number }[] = [];
       const fn = Promises.serialize(async () => {
           const start = Date.now();
           const idx = invoked.length;
           await sleep(11);
           invoked.push({
               idx,
               start,
               end: Date.now(),
           });
       });

       expect(invoked).to.have.lengthOf(0);

       await Promise.all([fn(), fn(), fn()]);

       expect(invoked.map(i => i.idx), 'in order').to.deep.equal([0, 1, 2]);
       expect(Math.min(...invoked.map(i => i.end - i.start)), 'duration').to.be.greaterThanOrEqual(10);
       for (let i = 1; i < invoked.length; ++i) {
           expect(invoked[i - 1].end, `${i} start to end`).to.be.lessThanOrEqual(invoked[i].start);
       }
   });

   it('should ignore rejected and invoke follow ups', async () => {
       let invoked: number[] = [];
       const fn = Promises.serialize(async () => {
           invoked.push(Date.now());
           if (invoked.length === 1) {
               throw Error(`Error ${invoked.length}`);
           }
           await sleep(10);
           if (invoked.length === 2) {
               return Promise.reject(Error(`Other Error ${invoked.length}`));
           }
       });

       await Promise.allSettled([fn(), fn(), fn(), fn(), fn()]);
       expect(invoked).lengthOf(5);
   });
});
