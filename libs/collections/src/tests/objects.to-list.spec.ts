import {Objects} from '../objects';

describe('Objects.toList', () => {
    const testSet = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
    };

    it('should map object to list', async () => {
        expect(Objects.toList(testSet, v => v + 1)).to.deep.equal([
           2, 3, 4, 5
        ]);
    });

    it('should ignore fields that return undefined', async () => {
        expect(Objects.toList(testSet, (v, k) => k === 'three' ? undefined : v)).to.deep.equal([
            1, 2, 4
        ]);
    });
});
