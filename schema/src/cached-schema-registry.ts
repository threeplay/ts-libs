import {Schema, SchemaRegistry} from './interface';

export class CachedSchemaRegistry implements SchemaRegistry{
    private readonly cache = new Map<string, Schema<unknown>>();

    constructor(
        private readonly registry: SchemaRegistry,
        private readonly options?: {
            resolveIfNotCached?: boolean;
        },
    ) {}

    public async getSchema(schema: string): Promise<Schema<unknown> | null> {
        const cachedSchema = this.cache.get(schema);
        if (cachedSchema) {
            return cachedSchema;
        }
        if (this.options?.resolveIfNotCached) {
            return this.resolveSchema(schema);
        }
        return null;
    }

    public async cacheIfNeeded(schemas: string[]): Promise<{ cached: string[], missing: string[], failed: { schema: string, error: Error }[] }> {
        const schemasToFetch = schemas.filter(schema => !this.cache.has(schema));
        const cached: string[] = [...this.cache.keys()];
        const missing: string[] = [];
        const failed: { schema: string, error: Error }[] = [];
        if (schemasToFetch.length > 0) {
            await Promise.all([...new Set(schemasToFetch)].map(async schemaName => {
                try {
                    const schema = await this.registry.getSchema(schemaName);
                    if (schema) {
                        this.cache.set(schemaName, schema);
                        cached.push(schemaName);
                    } else {
                        missing.push(schemaName);
                    }
                } catch (e) {
                    failed.push({ schema: schemaName, error: e });
                }
            }));
        }

        return { cached, missing, failed };
    }

    public isCached(schema: string): boolean {
        return this.cache.has(schema);
    }

    public resetAll() {
        this.cache.clear();
    }

    public delete(schema: string) {
        this.cache.delete(schema);
    }

    private async resolveSchema(schema: string): Promise<Schema<unknown> | null> {
        const resolveSchema = await this.registry.getSchema(schema);
        if (resolveSchema) {
            this.cache.set(schema, resolveSchema);
        }
        return resolveSchema;
    }



    // public async cacheIfNeeded(schemas: string[]): Promise<void> {
    // }
    //
    // public serialize(schema: string, data: unknown): Buffer | null {
    //     return this.cache.get(schema)?.serialize(data) ?? null;
    // }
    //
}
