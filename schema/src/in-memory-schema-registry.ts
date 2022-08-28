import {Schema, SchemaRegistry} from './interface';

export class InMemorySchemaRegistry implements SchemaRegistry {
    private registry = new Map<string, Schema<unknown>>();

    public add<T>(schema: Schema<T>) {
        this.registry.set(schema.name, schema);
    }

    public async getSchema(schemaName: string): Promise<Schema<unknown> | null> {
        return this.registry.get(schemaName) ?? null;
    }
}
