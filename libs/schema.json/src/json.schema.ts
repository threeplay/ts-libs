import {Schema, SchemaDeserializer, SchemaTypeSerializer} from '@threeplay/schema';
import Ajv, { JSONSchemaType  } from 'ajv';

export class JsonSchemaTypeSerializer implements SchemaTypeSerializer {
    readonly type: string = 'json';

    public fromBuffer(buf: Buffer): Schema<unknown> | null {
        try {
            const raw = JSON.parse(buf.toString('utf8'));
            if (raw && typeof raw === 'object' && 'name' in raw && 'type' in raw) {
                return JsonSchema.from(raw.type, raw.name);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    public toBuffer(schema: Schema<unknown>): Buffer | null {
        if (!(schema instanceof JsonSchema)) {
            return null;
        }

        return Buffer.from(
            JSON.stringify({
                name: schema.name,
                type: schema.schema,
            }), 'utf8',
        );
    }
}

export class JsonSchema<T> implements Schema<T> {
    public static from<T>(schema: JSONSchemaType<T>, name: string): Schema<T> {
        return new JsonSchema<T>(schema, name);
    }

    private readonly validator: (data: any) => boolean;

    private constructor(
        public readonly schema: JSONSchemaType<T>,
        public readonly name: string,
    ) {
        const ajv = new Ajv();
        this.validator = ajv.compile<T>(schema);
    }

    public validate(type: unknown): type is T {
        return this.validator(type);
    }

    public deserialize(buffer: Buffer): T | null {
        const result = JSON.parse(buffer.toString('utf8'))
        return this.validate(result) ? result : null;
    }

    public serialize(data: T): Buffer {
        return Buffer.from(JSON.stringify(data), 'utf8');
    }

    public transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null {
        return null;
    }
}
