import {Schema} from './interface';

export class TestNumberSchema implements Schema<number> {
    constructor(public readonly name?: string) {}

    public deserialize(buffer: Buffer): number | null {
        return buffer.length === 4 ? buffer.readUInt32LE() : null;
    }

    public serialize(data: number): Buffer {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(data);
        return buf;
    }

    public validate(type: unknown): type is number {
        return typeof type === 'number';
    }
}
