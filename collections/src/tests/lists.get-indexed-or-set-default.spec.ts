import {Lists} from '../lists';

describe('Lists.getIndexedOrSetDefault', () => {
    it('should return values without changing the array if they exists', async () => {
        const array = [1,2,3,4,5,6];

        expect(Lists.getIndexedOrSetDefault(array, 2, 10)).to.equal(3);
        expect(array).to.deep.equal([1,2,3,4,5,6]);
    });

    it('should assign default if array value is undefined', async () => {
        const array = [1,2,undefined,4,undefined,6];

        expect(Lists.getIndexedOrSetDefault(array, 2, 10)).to.equal(10);
        expect(array).to.deep.equal([1,2,10,4,undefined,6]);
    });

    it('should add items if index is above current length', async () => {
        const array = [1,2];

        expect(Lists.getIndexedOrSetDefault(array, 5, 10)).to.equal(10);
        expect(array).to.deep.equal([1,2,undefined, undefined, undefined, 10]);
    });

    it('should throw an error if index is negative', async () => {
        const array = [1, 2];

        expect(() => Lists.getIndexedOrSetDefault(array, -1, 10)).to.throw();
    });

    it('should throw an error if array is undefined', async () => {
        expect(() => Lists.getIndexedOrSetDefault(undefined as any, -1, 10)).to.throw();
    });
})
