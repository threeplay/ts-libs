import {TopicEvent} from "../topic-event";

export interface EventStreamConsumer {
    process(event: TopicEvent): Promise<void>;
}
