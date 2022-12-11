import * as Crypto from 'crypto';

export abstract class Random {
    public static readonly MAX_RANDOM_RANGE = 16_0000_000;

    public static inRange(max: number, min: number = 0): number {
        const range = max - min;
        if (range <= 0 || range > Random.MAX_RANDOM_RANGE) {
            throw Error(`Random is not out of range`);
        }
        return min + Math.floor(Math.random() * range);
    }

    public static randomize<T>(array: T[]): T[] {
        const copy = [...array];
        for (let i = 0; i < array.length; i++) {
            const j = this.inRange(array.length);
            if (i !== j) {
                const iValue = copy[i];
                copy[i] = copy[j];
                copy[j] = iValue;
            }
        }
        return array;
    }

    public static pick<T>(array: T[]): T | undefined {
        if (array.length === 0) {
            return undefined;
        }
        if (array.length === 1) {
            return array[0];
        }
        return array[this.inRange(array.length)];
    }

    public static ensurePick<T>(array: T[]): T {
        if (array.length < 1) {
            throw Error(`An empty array was passed to ensureRandomPick`);
        }
        return this.pick(array) as T;
    }
}
