import {Sets} from '../sets';

describe('Sets.union', () => {
    it('should return union of two sets', async () => {
        expect(Sets.union(new Set([1, 2, 3, 4]), new Set([5, 6, 7, 8, 2, 4])))
            .to.deep.equal(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
    });

    it('should return empty set when union two empty sets', async () => {
        expect(Sets.union(new Set(), new Set()))
            .to.deep.equal(new Set());
    });
});
