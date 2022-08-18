import {DeferredPromise} from './deferred-promise';
import {isDataView} from 'util/types';

describe('Deferred Promise', () => {
    let sut: DeferredPromise<number>;

    beforeEach(() => {
        sut = new DeferredPromise();
    });

    it('should not resolve or reject a deferred promise when created', async () => {
        let invoked = false;

        const immediatelyResolved = new Promise(resolve => { resolve(0); });

        await Promise.race([
            sut.promise.finally(() => { invoked = true; }),
            immediatelyResolved
        ]);

        expect(invoked).to.be.false;
        sut.resolve(0);
    });

    it('should resolve promise when calling resolve', async () => {
        const promise = sut.promise;
        sut.resolve(10);
        expect(await promise).to.equal(10);
    });

    it('should reject promise when calling reject', async () => {
        const promise = sut.promise;
        sut.reject(Error('rejected'));
        expect(promise).to.eventually.be.rejectedWith('rejected');
    });

    const expectedError = 'Deferred promise already completed';
    it('should throw if trying to resolve a completed deferred promise', async () => {
        sut.resolve(1);
        expect(() => sut.reject(Error('rejected'))).to.throw(expectedError);
        expect(() => sut.resolve(20)).to.throw(expectedError);
    });

    it('should throw if trying to reject a completed deferred promise', async () => {
        sut.reject(Error('rejected'));
        expect(() => sut.reject(Error('rejected-other'))).to.throw(expectedError);
        expect(() => sut.resolve(20)).to.throw(expectedError);
    });
});
