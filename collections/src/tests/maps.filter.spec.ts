import {Maps} from '../maps';

describe('Maps.filter', () => {
    const testSet = new Map([
        [1, 'one'],
        [2, 'two'],
        [3, 'three'],
        [4, 'four'],
    ]);

    it('should filter map values', async () => {
        expect(Maps.filter(testSet, (k, v) => k === 2 || v === 'three')).to.deep.equal(new Map([
            [2, 'two'],
            [3, 'three'],
        ]));
    });
});
