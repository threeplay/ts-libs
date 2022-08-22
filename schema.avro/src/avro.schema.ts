import { Type, Schema as AvroTypedSchema } from 'avsc';
import {Schema} from '@threeplay/schema';

export class AvroSchema<T> implements Schema<T> {
    public static from<T>(schema: AvroTypedSchema, name?: string): Schema<T> {
        return new AvroSchema<T>(Type.forSchema(schema), name);
    }

    private constructor(
        private readonly avroType: Type,
        public readonly name: string | undefined,
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
}
