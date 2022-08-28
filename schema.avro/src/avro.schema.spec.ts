import {AvroSchema, AvroSchemaTypeSerializer} from '.';
import {Schema, SchemaDeserializer} from "@threeplay/schema";
import {Schema as AvroTypedSchema} from "avsc";

interface Test {
   a: string;
   b: number;
}

const testAvroSchema: AvroTypedSchema = {
   type: 'record',
   name: 'Test',
   fields: [
      { name: 'a', type: 'string' },
      { name: 'b', type: 'int' },
   ],
};

function testEncodedSchema(): Buffer {
   return Buffer.from([2, 97, 10])
}

function makeTestSchema(): Schema<Test> {
   return AvroSchema.from(testAvroSchema, 'test');
}

class OtherSchema implements Schema<number> {
   readonly name: string = 'test';
   public deserialize(buffer: Buffer): number | null { return null; }
   public serialize(data: number): Buffer { throw Error(); }
   public validate(type: unknown): type is number { return false };
   transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null { return null; }
}


describe('Avro Schema', () => {
   let sut: Schema<Test>;

   before(() => {
      sut = makeTestSchema();
   });

   it('should serialize avro schema', async () => {
      expect(sut.serialize({ a: 'a', b: 5 })).to.deep.equal(testEncodedSchema());
   });

   it('should deserialize avro schema', async () => {
      expect({ ...sut.deserialize(testEncodedSchema()) }).to.deep.equal({
         a: 'a',
         b: 5,
      });
   });

   it('should validate schema', async () => {
      expect(sut.validate({ a: 'a', b: 5 })).to.be.true;
      expect(sut.validate({ a: 10, b: 5 })).to.be.false;
   });

   it('should allow transformation of backward compatible schemas', async () => {
      const readerSchema = AvroSchema.from<{}>({
         type: 'record',
         name: 'Test',
         fields: [
            { name: 'b', type: 'int' },
            { name: 'c', type: 'string', default: 'missing' },
         ],
      }, 'test2');

      const transformer = sut.transformTo(readerSchema);
      expect(transformer).to.not.be.null;

      expect({ ...transformer?.deserialize(testEncodedSchema()) }).to.deep.equal({
         b: 5,
         c: 'missing',
      });
   });

   it('should return null if trying to transform incompatible schema', async () => {
      const readerSchema = AvroSchema.from({
         type: 'record',
         name: 'Test',
         fields: [
            { name: 'b', type: 'int' },
            { name: 'c', type: 'string' },
         ],
      }, 'test2');

      expect(sut.transformTo(readerSchema)).to.be.null;
   });

   it('should return null if trying to transform non avro-schema', async () => {

      expect(sut.transformTo(new OtherSchema())).to.be.null;
   });
});

describe('schema type serializer', () => {
   let sut: AvroSchemaTypeSerializer;

   before(() => {
      sut = new AvroSchemaTypeSerializer();
   });

   it('should serialize avro schema', async () => {
      const serializedSchema = JSON.parse(sut.toBuffer(makeTestSchema())?.toString('utf8') ?? '');
      expect(serializedSchema).to.deep.equal({
         name: 'test',
         type: testAvroSchema,
      });
   });

   it('should deserialize avro schema', async () => {
      const serialized = Buffer.from(JSON.stringify({ name: 'test', type: testAvroSchema }), 'utf8');

      const schema = sut.fromBuffer(serialized);
      expect(schema?.name).to.equal('test');
   });

   it('should return null if not the right schema type', async () => {
      expect(sut.toBuffer(new OtherSchema())).to.be.null;
   });

   it('should return null if serialized schema is incorrect', async () => {
      expect(sut.fromBuffer(Buffer.from('{}', 'utf8'))).to.be.null;
      expect(sut.fromBuffer(Buffer.from('string', 'utf8'))).to.be.null;
   });
});
