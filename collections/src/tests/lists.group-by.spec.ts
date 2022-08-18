import {Lists} from '../lists';

describe('Lists.groupBy', () => {
    it('should group objects by named key', async () => {
        const items = [{ k: 'x', v: 1 },{ k: 'y', v: 'a' }, { k: 'z', v: [] }];

        expect(Lists.groupBy(items, 'k')).to.deep.equal(
                new Map([
                    [items[0].k, [items[0]]],
                    [items[1].k, [items[1]]],
                    [items[2].k, [items[2]]],
                ])
        );
    });

    it('should group objects by key mapping', async () => {
        const items = [{ k: 'x', v: 1 },{ k: 'y', v: 'a' }, { k: 'z', v: [] }];

        expect(Lists.groupBy(items, item => `${item.k}1` )).to.deep.equal(
            new Map([
                [`${items[0].k}1`, [items[0]]],
                [`${items[1].k}1`, [items[1]]],
                [`${items[2].k}1`, [items[2]]],
            ])
        );
    });

    it('should group multiple objects if they have the same key', async () => {
        const items = [{ k: 'x', v: 1 }, { k: 'z', v: [] }, { k: 'x', v: 'a' }, { k: 'z', v: [] }];

        expect(Lists.groupBy(items, 'k')).to.deep.equal(
            new Map([
                ['x', [items[0], items[2]]],
                ['z', [items[1], items[3]]],
            ])
        );
    });
})
