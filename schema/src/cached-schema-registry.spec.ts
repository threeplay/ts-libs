import {CachedSchemaRegistry} from './cached-schema-registry';
import {SchemaRegistry} from './interface';
import {getMock, Mock} from '@threeplay/test-support';
import {TestNumberSchema} from './common.spec';

describe('Cached Schema Registry', () => {
    let sut: CachedSchemaRegistry;
    let registry: Mock<SchemaRegistry>;

    beforeEach(() => {
        registry = getMock();
        sut = new CachedSchemaRegistry(registry);
    });

    it('should cache schemas when requested', async () => {
        registry.getSchema.withArgs('a').returns(new TestNumberSchema('a'));
        registry.getSchema.withArgs('b').returns(new TestNumberSchema('b'));
        registry.getSchema.withArgs('c').returns(new TestNumberSchema('c'));

        const response = await sut.cacheIfNeeded(['a', 'b', 'c']);
        expect(response).to.deep.equal({
            cached: ['a', 'b', 'c'],
            missing: [],
            failed: [],
        });

        expect(registry.getSchema.args).to.deep.equal([
            ['a'], ['b'], ['c'],
        ]);

        expect(sut.isCached('a'), 'a').to.be.true;
        expect(sut.isCached('b'), 'b').to.be.true;
        expect(sut.isCached('c'), 'c').to.be.true;
        expect(sut.isCached('d'), 'd').to.be.false;
    });

    it('should return missing if source registry returns null during caching', async () => {
        registry.getSchema.withArgs('a').returns(null);

        const response = await sut.cacheIfNeeded(['a']);

        expect(response).to.deep.equal({
            cached: [],
            missing: ['a'],
            failed: [],
        });

        expect(sut.isCached('a'), 'a').to.be.false;
    });

    it('should return errors during caching', async () => {
        const error = Error('conn error');
        registry.getSchema.withArgs('a').rejects(error);

        const response = await sut.cacheIfNeeded(['a']);

        expect(response).to.deep.equal({
            cached: [],
            missing: [],
            failed: [{ schema: 'a', error }],
        });

        expect(sut.isCached('a'), 'a').to.be.false;
    });

    it('should not resolve from source if not cached', async () => {
        expect(sut.isCached('a')).to.be.false;
        await expect(sut.getSchema('a')).to.eventually.be.null;
        expect(sut.isCached('a')).to.be.false;
    });

    describe('when resolveIfNotCached is true', () => {
        beforeEach(() => {
            sut = new CachedSchemaRegistry(registry, { resolveIfNotCached: true });
        });

        it('should return resolve schema from registry if not cached', async () => {
            const schema = new TestNumberSchema('a');
            registry.getSchema.withArgs('a').resolves(schema);

            expect(sut.isCached('a')).to.be.false;
            await expect(sut.getSchema('a')).to.eventually.be.instanceOf(TestNumberSchema);
            expect(sut.isCached('a')).to.be.true;
        });

        it('should return null if schema from registry returns null', async () => {
            registry.getSchema.withArgs('a').resolves(null);

            expect(sut.isCached('a')).to.be.false;
            await expect(sut.getSchema('a')).to.eventually.be.null;
            expect(sut.isCached('a')).to.be.false;
        });

        it('should throw an error if schema from registry throws an error', async () => {
            const error = Error('not conn');
            registry.getSchema.withArgs('a').rejects(error);

            expect(sut.isCached('a')).to.be.false;
            await expect(sut.getSchema('a')).to.eventually.be.rejectedWith(error);
            expect(sut.isCached('a')).to.be.false;
        });
    });

    describe('cache management', function () {
        beforeEach(async () => {
            registry.getSchema.withArgs('a').returns(new TestNumberSchema('a'));
            registry.getSchema.withArgs('b').returns(new TestNumberSchema('b'));
            await sut.cacheIfNeeded(['a', 'b']);
            expect(sut.isCached('a')).to.be.true;
            expect(sut.isCached('b')).to.be.true;
        });

        it('should remove cached schema', async () => {
            sut.delete('a');

            expect(sut.isCached('a')).to.be.false;
            expect(sut.isCached('b')).to.be.true;
        });

        it('should remove all cached schemas', async () => {
            sut.resetAll();

            expect(sut.isCached('a')).to.be.false;
            expect(sut.isCached('b')).to.be.false;
        });
    });
});
