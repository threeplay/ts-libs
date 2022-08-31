import {EventStreamEmitter, SchemaName, TopicEvent} from "@threeplay/event-stream";
import {CachedSchemaRegistry, Schema, SchemaRegistry} from "@threeplay/schema";
import {Kafka, KafkaJSConnectionError, Producer} from "kafkajs";
import {Lists, Objects} from "@threeplay/collections";
import {Promises} from "@threeplay/promises";

enum KafkaConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Ready = 'ready',
    Sending = 'sending',
    Disconnecting = 'disconnecting',
}

export class KafkaEventStreamEmitter implements EventStreamEmitter {
    private isEnabled = false;
    private state: KafkaConnectionState = KafkaConnectionState.Disconnected;
    private queue: TopicEvent[] = [];
    private batch: TopicEvent[] = [];
    private callback = new Callback();
    private registry: CachedSchemaRegistry;

    public static withConfig(config: {
        clientId: string;
        brokers: string[],
        schemaRegistry: SchemaRegistry,
    }): KafkaEventStreamEmitter {
        return this.withClient(new Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
        }), config.schemaRegistry);
    }

    public static withClient(client: Kafka, schemaRegistry: SchemaRegistry): KafkaEventStreamEmitter {
        return new KafkaEventStreamEmitter(client.producer(), schemaRegistry);
    }

    private constructor(
        private readonly producer: Producer,
        schemaRegistry: SchemaRegistry,
    ) {
        this.registry = CachedSchemaRegistry.wrapIfNeeded(schemaRegistry);
        this.enable({ resetBuffer: true }).catch();
    }

    public async enable(options: { resetBuffer?: boolean }): Promise<void> {
        if (!this.isEnabled) {
            this.isEnabled = true;
            if (options.resetBuffer) {
                this.queue = [];
                this.batch = [];
            }
            this.callback.once(1000, () => this.connect());
        }
    }

    public async disable(options: { flush?: boolean }): Promise<void> {
        if (this.isEnabled) {
            this.isEnabled = false;
        }
    }

    public async emit(event: TopicEvent): Promise<void> {
        this.queue.push(event);
        this.onEventQueued().catch();
    }

    private async connect(): Promise<void> {
        this.callback.cancel();
        this.state = KafkaConnectionState.Connecting;
        try {
            await this.producer.connect();
            this.state = KafkaConnectionState.Ready;
            await this.onReady();
        } catch (e) {
            this.state = KafkaConnectionState.Disconnected;
            this.callback.once(5000, () => this.connect());
        }
    }

    private async flush(maxItems?: number): Promise<void> {
        this.state = KafkaConnectionState.Sending;
        if (this.batch.length === 0) {
            this.batch = this.queue.splice(0, maxItems ?? this.queue.length);
        }

        await this.registry.cacheIfNeeded(
            this.batch
                .map(item => item.schema as string)
                .filter(schema => typeof schema === 'string')
        );
        const byTopic = Lists.groupBy(this.batch, 'topic');

        await this.producer.sendBatch({
            topicMessages: await Promises.map([...byTopic.entries()], async ([topic, events]) => ({
                topic,
                messages: await Promises.map(events, async event => Objects.removeUndefined({
                    key: event.metadata?.key,
                    headers: {
                        schema: schemaName(event.schema),
                        correlationId: event.metadata?.correlationId,
                    },
                    value: await this.serialize(event),
                })),
            }))
        });

        this.batch = [];
        this.state = KafkaConnectionState.Ready;
    }

    private async disconnect(): Promise<void> {
        this.state = KafkaConnectionState.Disconnecting;
        await this.producer.disconnect().catch();
        this.state = KafkaConnectionState.Disconnected;
    }

    private async onReady(): Promise<void> {
        try {
            await this.flush(10);
        } catch (e) {
            console.log(`Error during flush`, e);
            if (e instanceof KafkaJSConnectionError) {
                await this.disconnect();
            } else {
                // TODO: Count errors, if too many, disconnect and restart
                this.state = KafkaConnectionState.Ready;
            }
        }
    }

    private async onEventQueued(): Promise<void> {
        if (this.state === KafkaConnectionState.Disconnected) {
            return this.connect();
        } else if (this.state === KafkaConnectionState.Ready) {
            return this.onReady();
        }
    }

    private async serialize(event: TopicEvent): Promise<Buffer> {
        if (!event.schema) {
            if (Buffer.isBuffer(event.data)) {
                return event.data;
            } else if (typeof event.data === 'string') {
                return Buffer.from(event.data, 'utf-8');
            }
            return Buffer.from(JSON.stringify(event.data), 'utf-8');
        } else if (typeof event.schema === 'string') {
            const schema = await this.registry.getSchema(event.schema);
            if (schema) {
                return schema.serialize(event.data);
            }
            throw Error(`Missing schema '${event.schema}' while serializing topic event`);
        }
        return (event.schema as Schema<unknown>).serialize(event.data);
    }
}

function schemaName(schema: SchemaName | Schema<unknown> | undefined): string | undefined {
    if (typeof schema === 'string') {
        return schema;
    }
    return (schema as Schema<unknown>)?.name;
}
