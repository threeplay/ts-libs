import Sinon from "sinon";

type Method<R> = (...args: any[]) => R;
type AsyncLikeMethod<R> = (...args: any[]) => PromiseLike<R>;
type AsyncMethod<R> = (...args: any[]) => Promise<R>;

export interface TypedStub<ReturnType> extends Sinon.SinonStub {
    returns: (obj: ReturnType) => Sinon.SinonStub;
    resolves: (obj: ReturnType) => Sinon.SinonStub;
    withArgs: (...args: any[]) => TypedStub<ReturnType>;
    get: never;
}

export type Mock<T> = T & StubMethods<T>;

export type StubMethods<Attribute> =
    Attribute extends AsyncMethod<infer R0>
        ? TypedStub<R0> // Stub out async method
        : Attribute extends AsyncLikeMethod<infer R1>
            ? TypedStub<R1> // Stub out async-like method
            : Attribute extends Method<infer R2>
                ? TypedStub<R2> // Stub out normal method
                : Attribute extends Record<any, any>
                    ? { [K in keyof Attribute]: StubMethods<Attribute[K]> }
                    : Attribute;

export function getMock<T>(overrides: Partial<T> = {}): Mock<T> {
    const stubs = Object.assign({}, overrides);
    return new Proxy(stubs, {
        get(target: T, p: string | number | symbol, receiver: any): any {
            if (p in stubs) {
                // @ts-ignore
                return stubs[p];
            }
            // @ts-ignore
            stubs[p] = Sinon.stub();
            // @ts-ignore
            return stubs[p];
        },
    }) as Mock<T>;
}
