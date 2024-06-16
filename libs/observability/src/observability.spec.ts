import {Observability} from "./core";
import {Logger, ObservabilityTags} from "./types";

describe('Observability', () => {
    let sut: Observability;
    let logger: TestLogger;

    beforeEach(() => {
        logger = new TestLogger();
        Observability.assignLogger(logger);
        sut = Observability.for('test');
    });

    describe('logging', () => {
         it('should log info', async () => {
             sut.getLogger('test').info('my-message');

             expect(logger.logs).to.deep.equal([
                 { type: 'I', message: 'my-message', tags: { logger: 'test', module: 'test' } },
             ]);
         });
    });
});

class TestLogger implements Logger {
    public logs: { type: string; message: string; tags?: ObservabilityTags }[] = [];

    public debug(message: string, tags?: ObservabilityTags): void {
        this.logs.push({ type: 'D', message, tags });
    }

    public error(message: string, tags?: ObservabilityTags): void {
        this.logs.push({ type: 'E', message, tags });
    }

    public info(message: string, tags?: ObservabilityTags): void {
        this.logs.push({ type: 'I', message, tags });
    }

    public warn(message: string, tags?: ObservabilityTags): void {
        this.logs.push({ type: 'W', message, tags });
    }
}