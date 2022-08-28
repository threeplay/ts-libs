import {EventStreamEmitter} from "./emitter";
import {SchemaName, Topic, TopicEvent} from "./topic-event";
import {EventStreamConsumer} from "./consumer";
import {Schema, SchemaRegistry} from "@threeplay/schema";

interface ConsumerConfig {
    schema?: Schema<unknown>;
    consumer: EventStreamConsumer;
}

export class InMemoryEventStream implements EventStreamEmitter {
    public readonly consumers: { topic?: Topic, config: ConsumerConfig }[] = [];

    public constructor(private readonly options: {
        registry?: SchemaRegistry,
    } = {}) {}

    public async addConsumer(consumer: EventStreamConsumer, options?: {
        topic: Topic,
        schema: SchemaName | Schema<unknown>,
    }): Promise<void> {
        this.consumers.push({
            topic: options?.topic,
            config: {
                schema: await this.resolveSchema(options?.schema) ?? undefined,
                consumer,
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
                        consumerEvent = {
                            ...event,
                            data: transformer.deserialize(writerSchema.serialize(event.data)),
                        };
                    }
                }
                await consumer.config.consumer.process(consumerEvent);
            }
        }
    }
}
