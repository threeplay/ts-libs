import {JsonSchema, JsonSchemaTypeSerializer} from '.';
import {Schema, SchemaDeserializer} from "@threeplay/schema";
import { JSONSchemaType } from 'ajv';

interface Test {
   a: string;
   b: number;
}

const testJsonSchema: JSONSchemaType<Test> = {
   type: 'object',
   required: ['a', 'b'],
   properties: {
      'a': { type: 'string' },
      'b': { type: 'number' },
   },
};

function testEncodedSchema(): Buffer {
   return Buffer.from(JSON.stringify({ a: 'a', b: 5 }));
}

function makeTestSchema(): Schema<Test> {
   return JsonSchema.from(testJsonSchema, 'test');
}

class OtherSchema implements Schema<number> {
   readonly name: string = 'test';
   public deserialize(buffer: Buffer): number | null { return null; }
   public serialize(data: number): Buffer { throw Error(); }
   public validate(type: unknown): type is number { return false };
   transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null { return null; }
}


describe('Json Schema', () => {
   let sut: Schema<Test>;

   before(() => {
      sut = makeTestSchema();
   });

   it('should serialize json schema', async () => {
      expect(sut.serialize({ a: 'a', b: 5 })).to.deep.equal(testEncodedSchema());
   });

   it('should deserialize json schema', async () => {
      expect({ ...sut.deserialize(testEncodedSchema()) }).to.deep.equal({
         a: 'a',
         b: 5,
      });
   });

   it('should validate schema', async () => {
      expect(sut.validate({ a: 'a', b: 5 })).to.be.true;
      expect(sut.validate({ a: 10, b: 5 })).to.be.false;
   });

   it('should return null if trying to transform schema', async () => {
      const readerSchema = JsonSchema.from<{ b: number, c: string }>({
          type: 'object',
          required: ['b', 'c'],
          properties: {
             b: { type: 'number' },
             c: { type: 'string' },
          }
      }, 'test2');

      expect(sut.transformTo(readerSchema)).to.be.null;
   });

   it('should return null if trying to transform non json-schema', async () => {
      expect(sut.transformTo(new OtherSchema())).to.be.null;
   });
});

describe('schema type serializer', () => {
   let sut: JsonSchemaTypeSerializer;

   before(() => {
      sut = new JsonSchemaTypeSerializer();
   });

   it('should serialize json schema', async () => {
      const serializedSchema = JSON.parse(sut.toBuffer(makeTestSchema())?.toString('utf8') ?? '');
      expect(serializedSchema).to.deep.equal({
         name: 'test',
         type: testJsonSchema,
      });
   });

   it('should deserialize json schema', async () => {
      const serialized = Buffer.from(JSON.stringify({ name: 'test', type: testJsonSchema }), 'utf8');

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
