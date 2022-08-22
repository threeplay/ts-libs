import {MissingSchemaName, Schema, SchemaRegistry} from './interface';

export class InMemorySchemaRegistry implements SchemaRegistry {
    private registry = new Map<string, Schema<unknown>>();

    public add<T>(schema: Schema<T>, name?: string) {
        const schemaName = name ?? schema.name;
        if (!schemaName) {
            throw new MissingSchemaName();
        }
        this.registry.set(schemaName, schema);
    }

    public async getSchema(schemaName: string): Promise<Schema<unknown> | null> {
        return this.registry.get(schemaName) ?? null;
    }
}
