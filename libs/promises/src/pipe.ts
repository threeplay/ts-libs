import {Promises} from "./promises";

type PipeMappingAction<T, R> = (current: T) => Promise<R>;

export class PromisePipe<T> implements PromiseLike<T> {
    public static withValue<T>(value: T): PromisePipe<T> {
        return new PromisePipe<T>(async () => value);
    }

    public static forAction<T>(action: () => Promise<T>): PromisePipe<T> {
        return new PromisePipe<T>(action);
    }

    private readonly preActions: PipeMappingAction<unknown, unknown>[] = [];
    private readonly postActions: PipeMappingAction<unknown, unknown>[] = [];
    private readonly once = Promises.once<T>(async () => this.invoke());

    private constructor(private readonly action: () => Promise<T>) {}

    public withPreAction(action: (current: T) => Promise<void>): PromisePipe<T> {
        return this.withPreMapper(async current => {
            await action(current);
            return current;
        });
    }

    public withPreMapper<R>(action: (current: T) => Promise<R>): PromisePipe<R> {
        this.preActions.push(action as PipeMappingAction<unknown, unknown>);
        return this as unknown as PromisePipe<R>;
    }

    public withPostAction(action: (current: T) => Promise<void>): PromisePipe<T> {
        return this.withPostMapper(async current => {
            await action(current);
            return current;
        });
    }

    public withPostMapper<R>(action: (current: T) => Promise<R>): PromisePipe<R> {
        this.postActions.push(action as PipeMappingAction<unknown, unknown>);
        return this as unknown as PromisePipe<R>;
    }

    protected async invoke(): Promise<T> {
        let current: unknown = undefined;
        for (const action of this.preActions) {
            current = await action(current);
        }
        current = await this.action();
        for (const action of this.postActions) {
            current = await action(current);
        }
        return current as T;
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
        onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.once().then(onfulfilled, onrejected);
    }
}
