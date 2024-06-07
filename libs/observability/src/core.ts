import {Logger, Metrics, ObservabilityTags} from "./types";

export class Observability {
    private static readonly modules = new Map<string, Observability>();

    private static getNullLogger(): Logger {
        return {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        };
    }

    private static getNullMetrics(): Metrics {
        return {
            incrementBy: () => {},
            decrementBy: () => {},
            timing: () => {},
        };
    }

    public static for(module: string): Observability {
        return getOrCreate(module, this.modules, () => new Observability(module));
    }

    private readonly loggers = new Map<string, Logger>();
    private readonly metrics = new Map<string, Metrics>();
    private defaultLogger: Logger = Observability.getNullLogger();
    private defaultMetrics: Metrics = Observability.getNullMetrics();

    private constructor(private readonly module: string) {}

    public setDefaultLogger(logger: Logger): void {
        this.defaultLogger = logger;
    }

    public setDefaultMetrics(metrics: Metrics): void {
        this.defaultMetrics = metrics;
    }

    public setLogger(name: string, logger: Logger): void {
        this.loggers.set(name, logger);
    }

    public setMetrics(name: string, metrics: Metrics): void {
        this.metrics.set(name, metrics);
    }

    public getLogger(name: string, tags?: ObservabilityTags): Logger {
        return getOrCreate(name, this.loggers, () => ({
            debug: (msg, args) => this.defaultLogger.debug(msg, { ...tags, ...args }),
            info: (msg, args) => this.defaultLogger.info(msg, { ...tags, ...args }),
            warn: (msg, args) => this.defaultLogger.warn(msg, { ...tags, ...args }),
            error: (msg, args) => this.defaultLogger.error(msg, { ...tags, ...args }),
        }));
    }

    public getMetrics(name: string, tags?: ObservabilityTags): Metrics {
        return getOrCreate(name, this.metrics, () => ({
            incrementBy: (name, count, args) => this.defaultMetrics.incrementBy(name, count, args),
            decrementBy: (name, count, args) => this.defaultMetrics.decrementBy(name, count, args),
            timing: (name, durationInMs, args) => this.defaultMetrics.timing(name, durationInMs, args),
        }));
    }
}

function getOrCreate<T>(key: string, map: Map<string, T>, onCreate: () => T): T {
    const existing = map.get(key);
    if (existing) {
        return existing;
    }
    const instance = onCreate();
    map.set(key, instance);
    return instance;
}
