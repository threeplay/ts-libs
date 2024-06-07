export type ObservabilityTags = Record<string, string | number>;

export interface Logger {
    debug(message: string, tags?: ObservabilityTags): void;
    info(message: string, tags?: ObservabilityTags): void;
    warn(message: string, tags?: ObservabilityTags): void;
    error(message: string, tags?: ObservabilityTags): void;
}

export interface Metrics {
    incrementBy(name: string, count: number, tags?: ObservabilityTags): void;
    decrementBy(name: string, count: number, tags?: ObservabilityTags): void;
    timing(name: string, durationInMs: number, tags?: ObservabilityTags): void;
}
