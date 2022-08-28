import {MissingSchemaSerializer, Schema, SchemaRegistry, SchemaTypeSerializer} from "./interface";

export interface PersistentSchemaStore {
    save(type: string, name: string, schema: string): Promise<void>;
    load(name: string): Promise<{ type: string, schema: string } | null>;
}

export class PersistentSchemaRegistry implements SchemaRegistry {
    private readonly serializers = new Map<string, SchemaTypeSerializer>();

    constructor(
        private readonly store: PersistentSchemaStore,
        serializers?: SchemaTypeSerializer[],
    ) {
        serializers?.forEach(serializer => this.addSchemaSerializer(serializer));
    }

    public addSchemaSerializer(serializer: SchemaTypeSerializer) {
        this.serializers.set(serializer.type, serializer);
    }

    public async addSchema(schema: Schema<unknown>): Promise<void> {
        const serialized = this.serializeSchema(schema);
        if (!serialized) {
            throw new MissingSchemaSerializer(schema.name);
        }
        await this.store.save(serialized.type, schema.name, serialized.data.toString('base64'));
    }

    public async getSchema(schemaName: string): Promise<Schema<unknown> | null> {
        const loadedSerialized = await this.store.load(schemaName);
        if (!loadedSerialized) {
            return null;
        }

        const serializer = this.serializers.get(loadedSerialized.type);
        if (!serializer) {
            throw new MissingSchemaSerializer(schemaName, loadedSerialized.type);
        }

        const loadedSchema = serializer.fromBuffer(Buffer.from(loadedSerialized.schema, 'base64'))
        if (!loadedSchema) {
            return null;
        }

        return loadedSchema;
    }

    private serializeSchema(schema: Schema<unknown>): { type: string, data: Buffer } | null {
        for (const [type, serializer] of this.serializers.entries()) {
            const data = serializer.toBuffer(schema);
            if (data) {
                return { type, data };
            }
        }
        return null;
    }
}
