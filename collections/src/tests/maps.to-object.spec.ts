import {Maps} from '../maps';

describe('Maps.toObject', () => {
    const testSet = new Map([
        ['one', 1],
        ['two', 2],
        ['three', 3],
        ['four', 4],
    ]);

    it('should return object from map', async () => {
        expect(Maps.toObject(testSet)).to.deep.equal({
            one: 1,
            two: 2,
            three: 3,
            four: 4,
        });
    });

    it('should return object from map and transform value', async () => {
        expect(Maps.toObject(testSet, value => ({ v: value }))).to.deep.equal({
            one: { v: 1 },
            two: { v: 2 },
            three: { v: 3 },
            four: { v: 4 },
        });
    })
});
