import {Logger, Metrics, ObservabilityTags} from "./types";

export class Observability {
    private static readonly modules = new Map<string, Observability>();

    private static logger: Logger = Observability.createNullLogger();
    private static metrics: Metrics = Observability.createNullMetrics();

    public static createNullLogger(): Logger {
        return {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        };
    }

    public static createNullMetrics(): Metrics {
        return {
            incrementBy: () => {},
            decrementBy: () => {},
            timing: () => {},
        };
    }

    public static for(module: string): Observability {
        return getOrCreate(module, this.modules, () => new Observability(module));
    }

    public static assignLogger(logger: Logger): Logger {
        const current = this.logger;
        this.logger = logger;
        return current;
    }

    public static assignMetrics(metrics: Metrics): Metrics {
        const current = this.metrics;
        this.metrics = metrics;
        return current;
    }

    private readonly loggers = new Map<string, Logger>();
    private readonly metrics = new Map<string, Metrics>();
    private defaultLogger: Logger | null = null;
    private defaultMetrics: Metrics | null = null;

    private constructor(private readonly module: string) {}

    public setDefaultLogger(logger?: Logger | null): void {
        this.defaultLogger = logger ?? null;
    }

    public setDefaultMetrics(metrics?: Metrics | null): void {
        this.defaultMetrics = metrics ?? null;
    }

    public setLogger(name: string, logger?: Logger | null): void {
        if (logger) {
            this.loggers.set(name, logger);
        } else {
            this.loggers.delete(name);
        }
    }

    public setMetrics(name: string, metrics?: Metrics | null): void {
        if (metrics) {
            this.metrics.set(name, metrics);
        } else {
            this.loggers.delete(name);
        }
    }

    public getLogger(name: string, tags?: ObservabilityTags): Logger {
        const logger = () => this.loggers.get(name) ?? this.defaultLogger ?? Observability.logger;
        return getOrCreate(name, this.loggers, () => ({
            debug: (msg, args) => logger().debug(msg, { module: this.module, logger: name, ...tags, ...args }),
            info: (msg, args) => logger().info(msg, { module: this.module, logger: name, ...tags, ...args }),
            warn: (msg, args) => logger().warn(msg, { module: this.module, logger: name, ...tags, ...args }),
            error: (msg, args) => logger().error(msg, { module: this.module, logger: name, ...tags, ...args }),
        }));
    }

    public getMetrics(name: string, tags?: ObservabilityTags): Metrics {
        const metrics = () => this.metrics.get(name) ?? this.defaultMetrics ?? Observability.metrics;
        return getOrCreate(name, this.metrics, () => ({
            incrementBy: (name, count, args) => metrics().incrementBy(name, count, { module: this.module, logger: name, ...tags, ...args }),
            decrementBy: (name, count, args) => metrics().decrementBy(name, count, { module: this.module, logger: name, ...tags, ...args }),
            timing: (name, durationInMs, args) => metrics().timing(name, durationInMs, { module: this.module, logger: name, ...tags, ...args }),
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
