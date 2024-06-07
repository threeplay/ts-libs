import {Lists} from '../lists';

describe('Lists.distinct', () => {
    it('should return distinct items', async () => {
        expect(Lists.distinct([6,1,1,2,4,5,4,6,2,1,8,9,5,2,1])).to.deep.equal([6,1,2,4,5,8,9])
    });

    it('should return distinct items with custom key', async () => {
        expect(Lists.distinct([1,2,3,4,5,6,7,8], item => item % 3)).to.deep.equal([1,2,3]);
    });
})
