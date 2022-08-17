import {Dict} from './types';

export class Maps {
    public static transform<K, T, V>(map: Map<K, T>, mapper: (item: T) => V): Map<K, V> {
        const newMap = new Map<K, V>();
        map.forEach((v, k) => newMap.set(k, mapper(v)));
        return newMap;
    }

    public static filter<K, V>(map: Map<K, V>, keep: (key: K, value: V) => boolean): Map<K, V> {
        const filteredMap = new Map<K, V>();
        for (const [k, v] of map.entries()) {
            if (keep(k, v)) {
                filteredMap.set(k, v);
            }
        }
        return filteredMap;
    }

    public static getOrSetDefault<K, T>(map: Map<K, T>, key: K, def: T | (() => T)): T {
        const value = map.get(key);
        if (value) {
            return value;
        }
        const defaultValue = def instanceof Function ? def() : def;
        map.set(key, defaultValue);
        return defaultValue;
    }

    public static toObject<T, U = T>(map: Map<string, T>, valueMapper?: (value: T) => U): Dict<U> {
        const obj: Dict<U> = {};
        map.forEach((v, k) => obj[k] = valueMapper ? valueMapper(v) : v as unknown as U);
        return obj;
    }
}
