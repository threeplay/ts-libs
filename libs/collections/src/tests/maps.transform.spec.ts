import {Maps} from '../maps';

describe('Maps.transform', () => {
    const testSet = new Map([
        [1, 'one'],
        [2, 'two'],
        [3, 'three'],
        [4, 'four'],
    ]);

    it('should transform map values', async () => {
        expect(Maps.transform(testSet, item => `${item}-x`)).to.deep.equal(new Map([
            [1, 'one-x'],
            [2, 'two-x'],
            [3, 'three-x'],
            [4, 'four-x'],
        ]));
    });
});
