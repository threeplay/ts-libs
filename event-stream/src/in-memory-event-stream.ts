import {EventStreamEmitter} from "./emitter";
import {SchemaName, Topic, TopicEvent} from "./topic-event";
import {EventStreamProcessor} from "./consumer";
import {Schema, SchemaRegistry} from "@threeplay/schema";

interface ProcessorConfig {
    schema?: Schema<unknown>;
    processor: EventStreamProcessor;
}

export class InMemoryEventStream implements EventStreamEmitter {
    public readonly consumers: { topic?: Topic, config: ProcessorConfig }[] = [];

    public constructor(private readonly options: {
        registry?: SchemaRegistry,
    } = {}) {}

    public async addProcessor(processor: EventStreamProcessor, options?: {
        topic: Topic,
        schema: SchemaName | Schema<unknown>,
    }): Promise<void> {
        this.consumers.push({
            topic: options?.topic,
            config: {
                schema: await this.resolveSchema(options?.schema) ?? undefined,
                processor,
            },
        });
    }

    private async resolveSchema(schema?: SchemaName | Schema<unknown>): Promise<Schema<unknown> | null> {
        if (!schema) {
            return null;
        } else if (typeof schema === 'string') {
            const registry = this.options?.registry;
            if (!registry) {
                throw Error(`No registry to resolve schema: ${schema}`);
            }
            return await registry.getSchema(schema);
        }
        return null;
    }

    public async emit(event: TopicEvent): Promise<void> {
        for (const consumer of this.consumers) {
            if (!consumer.topic || consumer.topic === event.topic) {
                let consumerEvent = event;
                if (event.schema && consumer.config.schema) {
                    const writerSchema = await this.resolveSchema(event.schema);
                    if (!writerSchema) {
                        throw Error(`Cannot resolve writer schema: ${event.schema}`);
                    }
                    if (writerSchema.name !== consumer.config.schema.name) {
                        const transformer = writerSchema.transformTo(consumer.config.schema);
                        if (!transformer) {
                            throw Error(`Cannot transform from writer schema`);
                        }
                        consumerEvent = {
                            ...event,
                            data: transformer.deserialize(writerSchema.serialize(event.data)),
                        };
                    }
                }
                await consumer.config.processor.process(consumerEvent);
            }
        }
    }
}
