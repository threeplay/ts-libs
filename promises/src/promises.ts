import {DeferredPromise} from './deferred-promise';

export abstract class Promises {
    public static deferred<T>(): DeferredPromise<T> {
        return new DeferredPromise<T>();
    }

    public static async map<T, U>(list: T[], fn: (value: T) => Promise<U>): Promise<U[]> {
        return Promise.all(list.map(fn));
    }

    /**
     * Returns a method that calling it will invoke fn once and will share the promise
     * results after it is completed.
     * @param fn method to invoke once
     */
    public static once<T>(fn: () => Promise<T>): () => Promise<T> {
        let invoked: Promise<T> | undefined;
        return () => {
            if (!invoked) {
                invoked = fn();
            }
            return invoked;
        };
    }

    /**
     * Returns a method that will invoke fn once for each time it was called but
     * invocations will be serialized
     * @param fn method to invoke
     */
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
                } catch (e: any) {
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

    /**
     * Returns a method that will invoke the factory only once if called concurrently by
     *  multiple callers
     * @param factory function returning a promise to generate the result. This promise will
     *                be shared by all callers until it is resolved or rejected
     */
    public static shared<T>(factory: () => Promise<T>): () => Promise<T> {
        let executing: Promise<T> | null = null;
        return async () => {
            if (executing) {
                return executing;
            }
            executing = factory().finally(() => {
                executing = null;
            });
            return executing;
        };
    }

    public static keyedShared(): KeyedSharePromise {
        const executingPromises = new Map<string, Promise<unknown>>();
        return <T>(key: string, invoke: () => Promise<T>) => {
            const executing = executingPromises.get(key);
            if (executing) {
                return executing as Promise<T>;
            }
            const invoked = invoke().finally(() => {
                executingPromises.delete(key);
            });
            executingPromises.set(key, invoked);
            return invoked as Promise<T>;
        };
    }
}

type KeyedSharePromise = <T>(key: string, invoke: () => Promise<T>) => Promise<T>;
