export interface Schema<T> {
    readonly name?: string;

    validate(type: unknown): type is T;
    serialize(data: T): Buffer;
    deserialize(buffer: Buffer): T | null;
}

export interface SchemaRegistry {
    getSchema(schema: string): Promise<Schema<unknown> | null>;
}

export function schemaWithVersion(name: string, version: string): string {
    return `${name}:${version}`;
}

export abstract class SchemaError extends Error {}

export class MissingSchemaName extends Error {
    constructor() {
        super(`Missing schema name`);
    }
}


