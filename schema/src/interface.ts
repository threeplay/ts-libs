import {SchemaName} from "@threeplay/event-stream";

export interface SchemaDeserializer<T> {
    deserialize(buffer: Buffer): T | null;
}

export interface Schema<T> extends SchemaDeserializer<T>{
    readonly name: string;

    validate(type: unknown): type is T;
    serialize(data: T): Buffer;

    transformTo<U>(schema: Schema<U>): SchemaDeserializer<U> | null;
}

export interface SchemaTypeSerializer {
    readonly type: string;

    fromBuffer(buf: Buffer): Schema<unknown> | null;
    toBuffer(schema: Schema<unknown>): Buffer | null;
}

export interface SchemaRegistry {
    getSchema(schema: string): Promise<Schema<unknown> | null>;
}

export function schemaWithVersion(name: string, version: string): SchemaName {
    return `${name}:${version}` as SchemaName;
}

export function unpackSchemaName(schemaName: SchemaName): { name: string; version?: string } {
    const [name, version] = schemaName.split(':');
    return { name, version };
}

export abstract class SchemaError extends Error {}

export class MissingSchemaSerializer extends Error {
    constructor(schemaName: string, type?: string) {
        super(`Missing schema serializer for schema: ${schemaName} [type: ${type ?? 'unknown'}]`);
    }
}
