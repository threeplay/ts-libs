import {PersistentSchemaRegistry, PersistentSchemaStore} from "./persistent-schema-registry";
import {getMock, Mock} from "@threeplay/test-support";
import {TestNumberSchema, TestSchemaTypeSerializer, TestStringSchema} from "./common.spec";
import {MissingSchemaSerializer} from "./interface";

describe('Persistent schema registry', () => {
    let sut: PersistentSchemaRegistry;
    let store: Mock<PersistentSchemaStore>;

    beforeEach(() => {
        store = getMock();
        sut = new PersistentSchemaRegistry(store, [new TestSchemaTypeSerializer('string')]);
    });

    it('should not fail if no initial serializers', async () => {
        expect(new PersistentSchemaRegistry(store)).to.not.be.null;
    });

    describe('without serializers', () => {
        it('should throw an error if trying to add schema without serializer', async () => {
            await expect(sut.addSchema(new TestNumberSchema('a'))).to.eventually.be.rejectedWith(MissingSchemaSerializer);
        });

        it('should throw an error if trying to get schema without serializer', async () => {
            store.load.withArgs('a').resolves({ type: 'number', schema: 'number:a' });

            await expect(sut.getSchema('a')).to.eventually.be.rejectedWith(MissingSchemaSerializer);
        });
    });

    describe('with serializer', () => {
        beforeEach(() => {
            sut.addSchemaSerializer(new TestSchemaTypeSerializer('number'));
        });

        it('should store serialized schema', async () => {
            await sut.addSchema(new TestStringSchema('a'));
            await sut.addSchema(new TestNumberSchema('b'));

            expect(store.save.args).to.deep.equal([
                ['string', 'a', 'c3RyaW5nOmE='],
                ['number', 'b', 'bnVtYmVyOmI=']
            ]);
        });

        it('should return null if schema does\'t exist in the store', async () => {
            expect(await sut.getSchema('random')).to.be.null;
        });

        it('should load schema from store and return it', async () => {
            store.load.withArgs('a').resolves({ type: 'string', schema: 'c3RyaW5nOmE=' });
            store.load.withArgs('b').resolves({ type: 'number', schema: 'bnVtYmVyOmI=' });

            const aSchema = await sut.getSchema('a');
            expect(aSchema).to.be.instanceof(TestStringSchema);
            expect(aSchema?.name).to.equal('a');

            const bSchema = await sut.getSchema('b');
            expect(bSchema).to.be.instanceof(TestNumberSchema);
            expect(bSchema?.name).to.equal('b');
        });

        it('should return null if loaded schema cannot be deserialized', async () => {
            store.load.withArgs('a').resolves({ type: 'string', schema: Buffer.from('unknown:x', 'utf8').toString('base64') });

            expect(await sut.getSchema('a')).to.be.null;
        });

        it('should always load schema from store', async () => {
            store.load.withArgs('a').resolves({ type: 'string', schema: 'c3RyaW5nOmE=' });

            await sut.getSchema('a');
            expect(store.load.args).to.have.lengthOf(1);

            await sut.getSchema('a');
            expect(store.load.args).to.have.lengthOf(2);
        });
    });
});
