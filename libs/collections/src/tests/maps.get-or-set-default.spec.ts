import {Maps} from '../maps';

describe('Maps.getOrSetDefault', () => {
    it('should assign new values if they are missing', async () => {
        const m = new Map<string, number>();

        expect(Maps.getOrSetDefault(m, 'one', 5)).to.deep.equal(5);
        expect(Maps.getOrSetDefault(m, 'two', 10)).to.deep.equal(10);

        expect(m).to.deep.equal(new Map([
            ['one', 5],
            ['two', 10],
        ]));
    });

    it('should accept fn for default', async () => {
        const m = new Map<string, number>();

        expect(Maps.getOrSetDefault(m, 'one', () => 5)).to.deep.equal(5);

        expect(m).to.deep.equal(new Map([
            ['one', 5],
        ]));
    });

    it('should return existing value', async () => {
        const m = new Map([
            [1, 'one'],
            [2, 'two'],
        ]);

        expect(Maps.getOrSetDefault(m, 1, 'xxx')).to.deep.equal('one');

        expect(m).to.deep.equal(new Map([
            [1, 'one'],
            [2, 'two'],
        ]));
    });
});
