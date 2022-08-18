import {Objects} from '../objects';

describe('Objects.fromList', () => {
    const testSet = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
    };

    it('should convert list to object', async () => {
        expect(Objects.fromList([1, 2, 3], v => ({
            key: `f_${v}`,
            value: v,
        }))).to.deep.equal({
            f_1: 1,
            f_2: 2,
            f_3: 3,
        });
    });

    it('should ignore fields that return undefined', async () => {
        expect(Objects.fromList([1, 2, 3], v => v != 2 ? {
            key: `f_${v}`,
            value: v,
        } : undefined)).to.deep.equal({
            f_1: 1,
            f_3: 3,
        });
    });
});
