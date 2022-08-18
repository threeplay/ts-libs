import {Dict} from './types';

export abstract class Objects {
    public static toList<T, U>(source: Dict<T>, fn: (value: T, key: string) => U | undefined): U[] {
        const list: U[] = [];
        Object.keys(source).forEach(key => {
            const value = fn(source[key], key);
            if (value !== undefined) {
                list.push(value);
            }
        });
        return list;
    }

    public static fromList<T, U>(source: T[], fn: (value: T) => { key: string; value: U } | undefined): Dict<U> {
        const obj: Dict<U> = {};
        source.forEach(value => {
            const result = fn(value);
            if (result !== undefined) {
                obj[result.key] = result.value;
            }
        });
        return obj;
    }

    public static transform<T, U>(source: Dict<T>, fn: (value: T, key: string) => U): Dict<U> {
        const obj: { [key: string]: U } = {};
        Object.keys(source).forEach(key => {
            obj[key] = fn(source[key], key);
        });
        return obj;
    }

    public static removeUndefined<T>(possibleObject: T): T {
        if (Array.isArray(possibleObject)) {
            return possibleObject.map(obj => this.removeUndefined(obj)) as unknown as T;
        } else if (
            typeof possibleObject === 'object' &&
            possibleObject &&
            !Buffer.isBuffer(possibleObject)
        ) {
            const newObj: any = {};
            Object.keys(possibleObject).forEach(key => {
                const value = (possibleObject as any)[key];
                if (typeof value === 'object') {
                    newObj[key] = this.removeUndefined(value);
                } else if (value !== undefined) {
                    newObj[key] = value;
                }
            });
            return newObj;
        }
        return possibleObject;
    }
}
