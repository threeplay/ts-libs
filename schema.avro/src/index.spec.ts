import {libName} from './index';

describe('first test', () => {
    it('should be true', async () => {
        expect(libName()).to.equal('.template');
    });
});
