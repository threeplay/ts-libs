import {PersistentSchemaStore} from "@threeplay/schema";
import IoRedis from 'ioredis';

export class RedisSchemaRegistryStore implements PersistentSchemaStore {
    private readonly client: IoRedis.Redis;
    private readonly prefix: string;

    constructor(config?: { host?: string, port?: number, db?: number, prefix?: string, password?: string }) {
        this.client = new IoRedis({
            port: config?.port,
            host: config?.host,
            db: config?.db,
            password: config?.password,
        });
        this.prefix = config?.prefix ?? 'schema';
    }

    public async load(name: string): Promise<{ type: string; schema: string } | null> {
        const raw = await this.client.get(this.schemaKey(name));
        if (!raw) {
            return null;
        }
        const components = raw.split(':');
        if (components.length > 1) {
            return {
                type: components[0],
                schema: components.slice(1).join(':'),
            };
        }
        return null;
    }

    public async save(type: string, name: string, schema: string): Promise<void> {
        await this.client.setnx(this.schemaKey(name), `${type}:${schema}`);
    }

    private schemaKey(name: string): string {
        return this.prefix.length > 0 ? `${this.prefix}:${name}` : name;
    }
}
