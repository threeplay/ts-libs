import {Promises} from './promises';
import {sleep} from './sleep';
import {DeferredPromise} from "./deferred-promise";

describe('Promises.shared', () => {
   it('should share resolved result and invoke again after promise resolves', async () => {
       const invoked: number[] = [];
       let deferred: DeferredPromise<number> | undefined;

       const fn = Promises.shared(async () => {
           const idx = invoked.length;
           invoked.push(idx);
           deferred = new DeferredPromise<number>();
           return await deferred.promise;
       });

       const results: number[] = [];
       fn().then(r => results.push(r));
       fn().then(r => results.push(r));

       deferred?.resolve(1);
       await sleep(0);

       fn().then(r => results.push(r));
       fn().then(r => results.push(r));

       deferred?.resolve(2);
       await sleep(0);

       expect(invoked).to.deep.equal([0, 1]);
       expect(results).to.deep.equal([1, 1, 2, 2]);
   });

    it('should share rejected result and invoke again after promise rejected', async () => {
        const invoked: number[] = [];
        let deferred: DeferredPromise<number> | undefined;

        const fn = Promises.shared(async () => {
            const idx = invoked.length;
            invoked.push(idx);
            deferred = new DeferredPromise<number>();
            return await deferred.promise;
        });

        const results: string[] = [];
        fn().catch(e => results.push(e.message));
        fn().catch(e => results.push(e.message));

        deferred?.reject(Error('A'));
        await sleep(0);

        fn().then(r => results.push(r.toString()));
        fn().then(r => results.push(r.toString()));

        deferred?.resolve(2);
        await sleep(0);

        expect(invoked).to.deep.equal([0, 1]);
        expect(results).to.deep.equal(['A', 'A', '2', '2']);
    });
});

describe('Promises.keyedShared', () => {
    it('should share a promise with the same key', async () => {
        const fn = Promises.keyedShared();
        let invoked: number[] = [];

        const results: string[] = []
        fn('a', async () => {
            invoked.push(invoked.length);
            return 1;
        }).then(r => results.push(r.toString()));

        fn('a', async () => {
            invoked.push(invoked.length);
            return 10;
        }).then(r => results.push(r.toString()));
        fn('a', async () => {
            invoked.push(invoked.length);
            return 15;
        }).then(r => results.push(r.toString()));

        await sleep(0);

        fn('a', async () => 20).then(r => results.push(r.toString()));
        await sleep(0);
        fn('a', async () => 30).then(r => results.push(r.toString()));
        await sleep(0);

        expect(invoked).to.deep.equal([0]);
        expect(results).to.deep.equal(['1', '1', '1', '20', '30']);
    });

    it('should not share a promise if the key is different', async () => {
        const fn = Promises.keyedShared();

        const results: string[] = []
        fn('a', async () => 1).then(r => results.push(r.toString()));
        fn('a', async () => 2).then(r => results.push(r.toString()));
        fn('b', async () => 3).then(r => results.push(r.toString()));
        await sleep(0);

        expect(results).to.deep.equal(['1', '1', '3']);
    });
});
