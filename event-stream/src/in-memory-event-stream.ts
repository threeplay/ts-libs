import {EventStreamEmitter} from "./emitter";
import {SchemaName, Topic, TopicEvent} from "./topic-event";
import {EventStreamConsumer} from "./consumer";
import {Schema} from "@threeplay/schema";

interface ConsumerConfig {
    schema?: SchemaName | Schema<unknown>;
    consumer: EventStreamConsumer;
}

export class InMemoryEventStream implements EventStreamEmitter {
    public readonly consumers: { topic?: Topic, config: ConsumerConfig }[] = [];

    public addConsumer(consumer: EventStreamConsumer, options?: {
        topic: Topic,
        schema: SchemaName | Schema<unknown>,
    }) {
        this.consumers.push({
            topic: options?.topic,
            config: {
                schema: options?.schema,
                consumer,
            },
        });
    }

    public async emit(event: TopicEvent): Promise<void> {
        for (const consumer of this.consumers) {
            if (!consumer.topic || consumer.topic === event.topic) {
                // TODO: Convert schemas if needed
                await consumer.config.consumer.process(event);
            }
        }
    }
}
