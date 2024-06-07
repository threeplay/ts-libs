import {PromisePipe} from "./pipe";

describe('Promise pipe', () => {
    it('should create a pipe but doesn\'t execute it', async () => {
        const invoked: string[] = [];

        const pipe = PromisePipe.forAction(async () => {
            invoked.push('action');
            return 42;
        });

        pipe.withPreAction(async () => {
            invoked.push('pre-action-1');
        });
        pipe.withPostAction(async () => {
            invoked.push('post-action-1');
        });
        pipe.withPreAction(async () => {
            invoked.push('pre-action-2');
        });
        pipe.withPreAction(async () => {
            invoked.push('pre-action-3');
        });
        pipe.withPostAction(async () => {
            invoked.push('post-action-2');
        });
        expect(invoked).to.deep.equal([]);

        const result = await pipe;

        expect(result).to.equal(42);
        expect(invoked).to.deep.equal(['pre-action-1', 'pre-action-2', 'pre-action-3', 'action', 'post-action-1', 'post-action-2']);
    });

    it('should execute pipe only once', async () => {
        const invoked: string[] = [];

        const pipe = PromisePipe.forAction(async () => {
            invoked.push('action');
            return 42;
        });

        pipe.withPreAction(async () => {
            invoked.push('pre-action-1');
        });
        pipe.withPostAction(async () => {
            invoked.push('post-action-1');
        });

        expect(await pipe).to.equal(42);
        expect(await pipe).to.equal(42);
        expect(await pipe).to.equal(42);

        expect(invoked).to.deep.equal(['pre-action-1', 'action', 'post-action-1']);
    });
});
