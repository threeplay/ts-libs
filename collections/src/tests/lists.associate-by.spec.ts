import {Lists} from '../lists';

describe('Lists.associateBy', () => {
    it('should group objects by named key', async () => {
        const items = [{ k: 'x', v: 1 },{ k: 'y', v: 'a' }, { k: 'z', v: [] }];

        expect(Lists.associateBy(items, item => item.k)).to.deep.equal(
                new Map([
                    [items[0].k, items[0]],
                    [items[1].k, items[1]],
                    [items[2].k, items[2]],
                ])
        );
    });

    it('should override an object if it has the same key', async () => {
        const items = [{ k: 'x', v: 1 },{ k: 'x', v: 'a' }, { k: 'z', v: [] }];

        expect(Lists.associateBy(items, item => item.k)).to.deep.equal(
            new Map([
                [items[1].k, items[1]],
                [items[2].k, items[2]],
            ])
        );
    })
})
