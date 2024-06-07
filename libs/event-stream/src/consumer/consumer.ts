import {TopicEvent} from "../topic-event";
import {Schema, schemaDeserializer, SchemaMatching, SchemaRegistry} from "@threeplay/schema";

export interface EventStreamProcessor {
    process(event: TopicEvent): Promise<void>;
}

export interface EventStreamProcessorConfig {
    schema: Schema<unknown>;
    matching: SchemaMatching;
    processor: EventStreamProcessor;
}

export async function processTopicEvent(registry: SchemaRegistry, rawEvent: TopicEvent<Buffer>, processors: EventStreamProcessorConfig[]): Promise<void> {
    const writerSchema = rawEvent.schema;
    if (!writerSchema) {
        return;
    }
    await Promise.all(processors.map(async config => {
        const deserializer = await schemaDeserializer(registry, writerSchema, config.matching, config.schema);
        if (deserializer) {
            await config.processor.process({
                ...rawEvent,
                data: deserializer.deserialize(rawEvent.data),
            });
        }
    }));
}
