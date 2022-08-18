import {Lists} from '../lists';

describe('Lists.compact', () => {
    it('should compact an array from nulls and undefined', async () => {
        expect(Lists.compact([1, null, undefined, 5, 6, null, 7, undefined, 10])).to.deep.equal([1,5,6,7,10])
    });
})
