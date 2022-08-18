import {sleep} from './sleep';

describe('sleep', () => {
    it('should resolve after timeout', async () => {
        const start = Date.now();
        await sleep(25);
        const duration = Date.now() - start;
        expect(duration).to.be.greaterThanOrEqual(25);
    });
});
