import {
    CorrelationId,
    EventStreamProcessor,
    EventStreamProcessorConfig,
    processTopicEvent,
    SchemaName, Topic,
    TopicEvent, TopicKey
} from "@threeplay/event-stream";
import {CachedSchemaRegistry, Schema, schemaDeserializer, SchemaRegistry} from "@threeplay/schema";
import {Consumer, Kafka} from "kafkajs";
import {Objects} from "@threeplay/collections";

export class A implements EventStreamProcessor {
    public async process(event: TopicEvent): Promise<void> {
        return Promise.resolve(undefined);
    }
}

interface EventStreamTopicProcessor {
    topic: string | string[],
    processors: EventStreamProcessorConfig[];
}

export class KafkaEventStreamConsumer {
    public static withConfig(config: {
        clientId: string;
        groupId: string;
        brokers: string[],
        schemaRegistry: SchemaRegistry,
        processors: EventStreamTopicProcessor[],
    }): KafkaEventStreamConsumer {
        return this.withClient(new Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
        }), config.groupId, config.processors, config.schemaRegistry);
    }

    public static withClient(client: Kafka, groupId: string, processors: EventStreamTopicProcessor[], schemaRegistry: SchemaRegistry): KafkaEventStreamConsumer {
        return new KafkaEventStreamConsumer(client.consumer({ groupId }), processors, schemaRegistry);
    }

    private readonly registry: CachedSchemaRegistry;

    constructor(
        private readonly consumer: Consumer,
        private readonly processors: EventStreamTopicProcessor[],
        registry: SchemaRegistry
    ) {
        this.registry = CachedSchemaRegistry.wrapIfNeeded(registry);
    }

    public start(): void {
        this.consumer.connect()
    }

    public stop(): void {
    }

    // 1. Consumer connect
    // 2. Subscribe to topics
    // 3. Consumer disconnect
    private async run(): Promise<void> {
        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                const schemaName = ('headers' in message ? message.headers?.schema : undefined) as string;
                if (schemaName) {
                    const processorsForTopic = this.processors
                        .filter(processor => typeof processor.topic === 'string' ? topic === processor.topic : processor.topic.some(t => t === topic));
                    if (processorsForTopic.length <= 0) {
                        throw Error(`Not processors found for this topic: ${topic}`);
                    }
                    if (!message.value) {
                        throw Error(`Topic message without content: ${topic}`);
                    }
                    const rawTopicEvent: TopicEvent<Buffer> = {
                        topic: topic as Topic,
                        schema: schemaName as SchemaName,
                        data: message.value,
                        metadata: Objects.removeUndefined({
                            key: message.key?.toString('utf-8') as TopicKey,
                            correlationId: message.headers?.correlationId?.toString('utf-8') as CorrelationId,
                        }),
                    };
                    await Promise.all(
                        processorsForTopic.map(async processor => {
                            await processTopicEvent(this.registry, rawTopicEvent, processor.processors);
                        }),
                    );
                }
            },
        });
    }
}
