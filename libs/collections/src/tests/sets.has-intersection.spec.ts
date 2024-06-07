import {Sets} from '../sets';

describe('Sets.hasIntersection', () => {
    it('should return true if sets have intersection', async () => {
        expect(Sets.hasIntersection(new Set([1, 2, 3, 4]), new Set([5, 6, 7, 8, 2])))
            .to.be.true;
    });

    it('should return false if sets don\'t have intersection', async () => {
        expect(Sets.hasIntersection(new Set([1, 2, 3, 4]), new Set([5, 6, 7, 8])))
            .to.be.false;
    });

    it('should return false when checking empty sets', async () => {
        expect(Sets.hasIntersection(new Set([1]), new Set())).to.be.false;
        expect(Sets.hasIntersection(new Set(), new Set([1]))).to.be.false;
        expect(Sets.hasIntersection(new Set(), new Set())).to.be.false;
    });
});
