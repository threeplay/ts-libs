export class Callback {
    private timeout: NodeJS.Timeout | undefined;

    public once(ms: number, fn: () => Promise<void>): void {
        this.cancel();
        this.timeout = setTimeout(() => fn().catch(), ms);
    }

    public immediate(fn: () => Promise<void>): void {
        this.once(0, fn);
    }

    public cancel(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }
}
