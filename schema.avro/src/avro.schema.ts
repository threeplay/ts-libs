import { Type, Schema as AvroTypedSchema } from 'avsc';
import {Schema, SchemaDeserializer, SchemaTypeSerializer} from '@threeplay/schema';

export class AvroSchemaTypeSerializer implements SchemaTypeSerializer {
    readonly type: string = 'avro';

    public fromBuffer(buf: Buffer): Schema<unknown> | null {
        try {
            const raw = JSON.parse(buf.toString('utf8'));
            if (raw && typeof raw === 'object' && 'name' in raw && 'type' in raw) {
                return AvroSchema.from(raw.type, raw.name);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    public toBuffer(schema: Schema<unknown>): Buffer | null {
        if (!(schema instanceof AvroSchema)) {
            return null;
        }

        return Buffer.from(
            JSON.stringify({
                name: schema.name,
                type: schema.avroType.toJSON(),
            }), 'utf8',
        );
    }
}

export class AvroSchema<T> implements Schema<T> {
    public static from<T>(schema: AvroTypedSchema, name: string): Schema<T> {
        return new AvroSchema<T>(Type.forSchema(schema), name);
    }

    private constructor(
        public readonly avroType: Type,
        public readonly name: string,
    ) {}

    public validate(type: unknown): type is T {
        return this.avroType.isValid(type);
    }

    public deserialize(buffer: Buffer): T | null {
        return this.avroType.fromBuffer(buffer);
    }

    public serialize(data: T): Buffer {
        return this.avroType.toBuffer(data);
    }

    public transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null {
        if (!(schema instanceof AvroSchema)) {
            return null;
        }
        try {
            const resolver = schema.avroType.createResolver(this.avroType);
            return {
                deserialize: buffer => schema.avroType.fromBuffer(buffer, resolver) as U,
            }
        } catch (e) {
            return null;
        }
    }
}
