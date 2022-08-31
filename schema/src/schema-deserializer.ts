import {Schema, SchemaDeserializer, SchemaRegistry, unpackSchemaName} from "./interface";
import {SchemaName} from "@threeplay/event-stream";

export type SchemaMatching = 'any' | 'exact' | 'similar';

/**
 * Return a schema deserializer between writer and reader schema. Resolving writer schema from registry if needed.
 * Deserializer will only return if reader and writer schemas pass the matching test
 *
 * @param registry schema registry to use to load writer schema if passed by name
 * @param writerSchema either a schema name or schema. If just name passed, it will need to be resolved from the registry
 * @param matching which schemas are considered compatible for conversion:
 *   any     - all schemas,
 *   exact   - exact schema type and version match,
 *   similar - ignore version and match on schema type
 * @param readerSchema reader schema to return serializer for
 * @returns serializer if schemas are compatible, or null otherwise
 * @throws registry errors if fails to resolve writer schema
 */
export async function schemaDeserializer<T>(registry: SchemaRegistry, writerSchema: SchemaName | Schema<unknown>, matching: SchemaMatching, readerSchema: Schema<T>): Promise<SchemaDeserializer<T> | null> {
    const writerSchemaName = typeof writerSchema === 'string' ? writerSchema : (writerSchema as Schema<unknown>).name;
    if (readerSchema.name === writerSchemaName) {
        return readerSchema;
    }
    switch (matching) {
        case 'exact':
            return null;
        case 'any':
            break;
        case 'similar':
            const { name: writerSchemaType } = unpackSchemaName(writerSchemaName as SchemaName);
            const { name: readerSchemaType } = unpackSchemaName(readerSchema.name as SchemaName);
            if (writerSchemaType !== readerSchemaType) {
                return null;
            }
            break;
        default:
            return null;
    }
    const schema = typeof writerSchema === 'string' ? await registry.getSchema(writerSchema) : (writerSchema as Schema<unknown>);
    return schema?.transformTo(readerSchema) ?? null;
}
