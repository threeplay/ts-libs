import {Schema} from './interface';

export class TestNumberSchema implements Schema<number> {
    constructor(public readonly name?: string) {}

    public deserialize(buffer: Buffer): number | null {
        return buffer.length === 4 ? buffer.readUInt32LE() : null;
    }

    public serialize(data: number): Buffer {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(data);
        return buf;
    }

    public validate(type: unknown): type is number {
        return typeof type === 'number' && Number.isInteger(type);
    }
}

describe('TestNumberSchema', () => {
    let sut: TestNumberSchema;

    before(() => {
        sut = new TestNumberSchema('a');
    });

    it('should validate a number', async () => {
         expect(sut.validate('a')).to.be.false;
         expect(sut.validate(5)).to.be.true;
         expect(sut.validate(5.5)).to.be.false;
    });

    it('should serialize a number', async () => {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(12345);
        expect(sut.serialize(12345)).to.deep.equal(buf);
    });

    it('should deserialize a number', async () => {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(12345);
        expect(sut.deserialize(buf)).to.equal(12345);
    });

    it('should return deserialize null if size is incorrect', async () => {
        const buf = Buffer.alloc(5);
        expect(sut.deserialize(buf)).to.be.null;
    });
});
