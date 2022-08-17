export class Lists {
    public static distinct<T>(list: T[], byKey: (item: T) => unknown = key => key): T[] {
        const seen = new Set<unknown>();
        return list.filter(item => {
            const key = byKey(item);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    public static reorder<T, K>(list: T[], orderKeys: K[], byKey: (item: T) => K): T[] {
        const allDistinctOrderedKeys = this.distinct([...orderKeys, ...list.map(byKey)]);
        const itemMap = new Map<K, T>();
        list.forEach(item => itemMap.set(byKey(item), item));
        return allDistinctOrderedKeys.filter(key => itemMap.has(key)).map(key => itemMap.get(key) as T);
    }

    public static groupBy<T, K extends keyof T>(list: T[], byKey: K): Map<T[K], T[]>;
    public static groupBy<T, K>(list: T[], byKey: ((item: T) => K)): Map<K, T[]>;
    public static groupBy<T, K>(list: T[], byKey: ((item: T) => K) | keyof T): Map<K, T[]> {
        const group = new Map<K, T[]>();
        const itemKey = byKey instanceof Function ? byKey : (item: any) => item[byKey] as K;
        list.forEach(item => {
            const k = itemKey(item);
            const groupItems = group.get(k as K) ?? [];
            groupItems.push(item);
            group.set(k as K, groupItems);
        });
        return group;
    }

    public static associateByKey<T, K>(list: T[], byKey: (item: T) => K): Map<K, T> {
        const association = new Map<K, T>();
        list.forEach(item => association.set(byKey(item), item));
        return association;
    }

    public static flatten<V>(list: V[][]): V[] {
        const flattened: V[] = [];
        list.forEach(top => top.forEach(v => flattened.push(v)));
        return flattened;
    }

    public static compact<V>(list: (V | undefined | null)[]): V[] {
        return list.filter(element => element !== undefined && element !== null) as V[];
    }

    public static getIndexedOrSetDefault<T>(array: T[], index: number, def: T): T {
        if (index < 0 || index === undefined) {
            throw Error(`negative or undefined index are not allowed`);
        }
        if (index < array.length && array[index] !== undefined) {
            return array[index];
        }

        array[index] = def;
        return def;
    }
}
