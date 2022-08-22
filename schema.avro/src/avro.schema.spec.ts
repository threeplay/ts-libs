import {AvroSchema} from '.';

interface Test {
   a: string;
   b: number;
}

function testEncodedSchema(): Buffer {
   return Buffer.from([2, 97, 10])
}

describe('Avro Schema', () => {
   let sut: AvroSchema<Test>;

   before(() => {
      sut = AvroSchema.from({
         type: 'record',
         name: 'Test',
         fields: [
            { name: 'a', type: 'string' },
            { name: 'b', type: 'int' },
         ],
      }, 'test');
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
});
