import {Schema} from "@threeplay/schema";

export type CorrelationId = string & { __type: 'correlation-id' };
export type TopicKey = string & { __type: 'topic-key' };
export type Topic = string & { __type: 'topic' };
export type SchemaName = string & { __type: 'schema-name' };

export interface TopicEvent<T = unknown> {
    topic: Topic;
    schema?: SchemaName | Schema<T>;
    metadata?: {
        key?: TopicKey;
        correlationId?: CorrelationId;
    };
    data: T;
}
