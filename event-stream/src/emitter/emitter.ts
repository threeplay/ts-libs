import {TopicEvent} from "../topic-event";

export interface EventStreamEmitter {
    emit(event: TopicEvent): Promise<void>;
}
