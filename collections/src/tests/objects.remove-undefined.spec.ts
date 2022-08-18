import {Objects} from '../objects';

describe('Objects.removeUndefined', () => {
    it('should remove undefined values', async () => {
        expect(Objects.removeUndefined({
            one: 1,
            two: undefined,
            three: 3,
        })).to.deep.equal({
            one: 1,
            three: 3,
        });
    });

    it('should recursively remove undefined values', async () => {
        const r = Objects.removeUndefined({
            one: { one: 1, two: undefined },
            two: [{ one: undefined, two: 2 }, undefined, { one: 1 }],
            three: { one: { two: { three: undefined, four: 4 } } },
        });
        expect(r).to.deep.equal({
            one: { one: 1 },
            two: [{ two: 2 }, undefined, { one: 1 }],
            three: { one: { two: { four: 4 } } },
        });
    });

    it('should keep Buffer', async () => {
        expect(Objects.removeUndefined({
            one: Buffer.from('test', 'utf-8'),
        })).to.deep.equal({
            one: Buffer.from('test', 'utf-8'),
        });
    });

    it('should process arrays', async () => {
        expect(Objects.removeUndefined([1, 2, undefined, 4])).to.deep.equal([1, 2, undefined, 4]);
    });

    it('should return primitives', async () => {
        expect(Objects.removeUndefined(Buffer.from('x', 'utf-8')))
            .to.be.instanceof(Buffer).and.deep.equal(Buffer.from('x', 'utf-8'));
        expect(Objects.removeUndefined(1)).to.deep.equal(1);
        expect(Objects.removeUndefined('x')).to.deep.equal('x');
    });
});
