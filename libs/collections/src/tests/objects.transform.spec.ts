import {Objects} from '../objects';

describe('Objects.transform', () => {
    const testSet = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
    };

    it('should map object value', async () => {
        expect(Objects.transform(testSet, v => v + 1)).to.deep.equal({
            one: 2,
            two: 3,
            three: 4,
            four: 5,
        });
    });
});
