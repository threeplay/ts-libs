import {Schema, SchemaDeserializer, SchemaTypeSerializer} from './interface';

export class TestNumberSchema implements Schema<number> {
    constructor(public readonly name: string) {}

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

    public transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null {
        if (schema instanceof TestStringSchema) {
            return {
                deserialize: buffer => {
                    const value = this.deserialize(buffer);
                    return value !== null ? `${value}` as unknown as U : null;
                }
            }
        }
        return null;
    }
}

export class TestStringSchema implements Schema<string> {
    constructor(public readonly name: string) {}

    public deserialize(buffer: Buffer): string | null {
        return buffer.toString('utf8');
    }

    public serialize(data: string): Buffer {
        return Buffer.from(data, 'utf8');
    }

    public validate(type: unknown): type is string {
        return typeof type === 'string';
    }

    public transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null {
        if (schema instanceof TestNumberSchema) {
            return {
                deserialize: buffer => {
                    const value = this.deserialize(buffer);
                    return value !== null ? parseInt(value) as unknown as U : null;
                },
            }
        }
        return null;
    }
}

export class TestSchemaTypeSerializer implements SchemaTypeSerializer {
    constructor(public readonly type: string) {}

    fromBuffer(buf: Buffer): Schema<unknown> | null {
        const [type, name] = buf.toString('utf8').split(':');
        if (type !== this.type) {
            return null;
        }
        switch (type) {
            case 'number': return new TestNumberSchema(name);
            case 'string': return new TestStringSchema(name);
            default: return null;
        }
    }

    toBuffer(schema: Schema<unknown>): Buffer | null {
        if (schema instanceof TestNumberSchema && this.type === 'number') {
            return Buffer.from(`number:${schema.name}`, 'utf8');
        } else if (schema instanceof TestStringSchema && this.type === 'string') {
            return Buffer.from(`string:${schema.name}`, 'utf8');
        }
        return null;
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

    it('should transform schema to string', async () => {
        const transformer = sut.transformTo(new TestStringSchema('b'));
        expect(transformer).to.not.be.null;

        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(12345);

        expect(transformer?.deserialize(buf)).to.equal('12345');
    });

    it('should null if transformTo schema is unknown', async () => {
        expect(sut.transformTo(new TestNumberSchema('c'))).to.be.null;
    });
});
