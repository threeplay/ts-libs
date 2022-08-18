import {Lists} from '../lists';

describe('Lists.flatten', () => {
    it('should return flattened array', async () => {
        expect(Lists.flatten([[1, 2], [5, 6], [2, 3]])).to.deep.equal([1,2,5,6,2,3])
    });
})
