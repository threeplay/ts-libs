import {DeferredPromise} from './deferred-promise';

export abstract class Promises {
    public static deferred<T>(): DeferredPromise<T> {
        return new DeferredPromise<T>();
    }

    public static async map<T, U>(list: T[], fn: (value: T) => Promise<U>): Promise<U[]> {
        return Promise.all(list.map(fn));
    }

    public static once(fn: () => Promise<void>): () => Promise<void> {
        let invoked: Promise<void> | undefined;
        return () => {
            if (!invoked) {
                invoked = fn();
            }
            return invoked;
        };
    }

    public static serialize(fn: () => Promise<void>): () => Promise<void> {
        const queue: (() => Promise<void>)[] = [];
        let running = false;

        const checkQueue = async () => {
            const next = queue.shift();
            if (next) {
                await next();
            }
        };

        return async () => {
            const deferredPromise = new DeferredPromise<void>();
            queue.push(async () => {
                running = true;
                try {
                    await fn();
                    deferredPromise.resolve();
                } catch (e) {
                    deferredPromise.reject(e);
                } finally {
                    running = false;
                    checkQueue().catch();
                }
            });
            if (!running) {
                checkQueue().catch();
            }
            return deferredPromise.promise;
        };
    }
}
