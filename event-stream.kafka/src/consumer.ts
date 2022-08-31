import {
    CorrelationId,
    EventStreamProcessor,
    EventStreamProcessorConfig,
    processTopicEvent,
    SchemaName, Topic,
    TopicEvent, TopicKey
} from "@threeplay/event-stream";
import {CachedSchemaRegistry, SchemaRegistry} from "@threeplay/schema";
import {Consumer, Kafka} from "kafkajs";
import {Objects} from "@threeplay/collections";
import {Callback} from "./utils";

export class A implements EventStreamProcessor {
    public async process(event: TopicEvent): Promise<void> {
        return Promise.resolve(undefined);
    }
}

interface EventStreamTopicProcessor {
    topic: string | string[],
    processors: EventStreamProcessorConfig[];
}

enum KafkaConsumerState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Subscribing = 'subscribing',
    Subscribed = 'subscribed',
    Running = 'running',
    Disconnecting = 'disconnecting',
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
    private state: KafkaConsumerState = KafkaConsumerState.Disconnected;
    private isEnabled: boolean = false;
    private callback = new Callback();

    constructor(
        private readonly consumer: Consumer,
        private readonly processors: EventStreamTopicProcessor[],
        registry: SchemaRegistry
    ) {
        this.registry = CachedSchemaRegistry.wrapIfNeeded(registry);
    }

    public enable(): void {
        if (!this.isEnabled) {
            this.isEnabled = true;
            this.callback.immediate(() => this.connect());
        }
    }

    public disable(): void {
        if (this.isEnabled) {
            this.isEnabled = false;
            this.callback.immediate(() => this.disconnect());
        }
    }

    private async nextState(): Promise<void> {
        switch (this.state) {
            case KafkaConsumerState.Disconnected:
                if (this.isEnabled) {
                    this.callback.immediate(() => this.connect());
                }
                break;

            case KafkaConsumerState.Connected:
            case KafkaConsumerState.Subscribed:
            case KafkaConsumerState.Running:
                if (!this.isEnabled) {
                    this.callback.immediate(() => this.disconnect());
                }
                break;

            //
            case KafkaConsumerState.Connecting:
            case KafkaConsumerState.Subscribing:
            case KafkaConsumerState.Disconnecting:
                break;
        }
    }

    private async connect(): Promise<void> {
        if (this.state === KafkaConsumerState.Disconnected) {
            try {
                this.state = KafkaConsumerState.Connecting;
                await this.consumer.connect();
                this.state = KafkaConsumerState.Connected;
                this.callback.immediate(() => this.subscribe());
            } catch(e) {
                console.log(`Failed connecting`, e);
                this.state = KafkaConsumerState.Disconnected;
                this.callback.once(1000, () => this.nextState());
            }
        }
    }

    private async disconnect(): Promise<void> {
        if (this.state !== KafkaConsumerState.Disconnected) {
            try {
                this.state = KafkaConsumerState.Disconnecting;
                await this.consumer.disconnect();
                this.state = KafkaConsumerState.Disconnected;
            } catch (e) {
                this.state = KafkaConsumerState.Disconnecting;
                this.callback.once(1000, () => this.disconnect());
            }
        }
    }

    private async subscribe(): Promise<void> {
        if (this.state === KafkaConsumerState.Connected) {
            try {
                this.state = KafkaConsumerState.Subscribing;
                const topics = [...new Set(this.processors.flatMap(config => typeof config.topic === 'string' ? [config.topic] : config.topic))];
                await this.consumer.subscribe({
                    topics,
                    fromBeginning: true,
                });
                this.state = KafkaConsumerState.Subscribed;
                this.callback.immediate(() => this.run());
            } catch(e) {
                console.log(`Failed subscribing`, e);
                this.state = KafkaConsumerState.Connected;
                this.callback.once(1000, () => this.nextState());
            }
        }
    }

    private async run(): Promise<void> {
        try {
            this.state = KafkaConsumerState.Running;
            await this.consumer.run({
                eachMessage: async ({topic, message}) => {
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
                        console.log(`Received Topic message: ${topic}: ${message.value.length}bytes`);
                        await Promise.all(
                            processorsForTopic.map(async processor => {
                                await processTopicEvent(this.registry, rawTopicEvent, processor.processors);
                            }),
                        );
                    }
                },
            });
        } catch (e) {
            console.log(`Failed to run`, e);
            this.state = KafkaConsumerState.Subscribed;
            this.callback.once(1000, () => this.nextState());
        }
    }
}
