import {InMemorySchemaRegistry, MissingSchemaName, Schema} from './';
import {TestNumberSchema} from './common.spec';

describe('In Memory Schema Registry', () => {
    let sut: InMemorySchemaRegistry;

    beforeEach(() => {
        sut = new InMemorySchemaRegistry();
    });

    it('should return null if schema is missing', async () => {
        expect(await sut.getSchema('a')).to.be.null;
        expect(await sut.getSchema('b')).to.be.null;
    });

    it('should return added schema with its schema name', async () => {
        sut.add(new TestNumberSchema('a'));

        const schema = await sut.getSchema('a');
        expect(schema).to.be.instanceof(TestNumberSchema);
        expect(schema?.name).to.equal('a');
    });
});
