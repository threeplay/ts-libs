export class DeferredPromise<T> {
    private completed = false;
    private promiseResolve: ((value: T) => void) | undefined;
    private promiseReject: ((error: Error) => void) | undefined;

    public promise: Promise<T>;

    public constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.promiseResolve = resolve;
            this.promiseReject = reject;
        });
    }

    public reject(error: Error) {
        this.assetNotCompleted();
        this.completed = true;
        this.promiseReject!(error);
    }

    public resolve(value: T) {
        this.assetNotCompleted();
        this.completed = true;
        this.promiseResolve!(value);
    }

    private assetNotCompleted() {
        if (this.completed) {
            throw Error(`Deferred promise already completed`);
        }
    }
}
