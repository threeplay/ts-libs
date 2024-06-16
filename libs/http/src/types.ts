export type RequestParams = {
    headers: Record<string, string>;
    params: Record<string, string>;
    query: Record<string, string>;
}
export type Request = RequestParams & {
    bodyBuffer: () => Buffer;
    bodyJson<T>(): T;
};

export type Response<T = unknown> = {
    status?: number;
    headers?: Record<string, string>;
    buffer?: Buffer;
    json?: T;
};

export type Method = {
    contentType?: string;
    handler: MethodHandler;
}

export type WebSocketConnection = {
    write(buffer: Buffer): Promise<void>;
    close(): Promise<void>;

    onRead(cb: (data: Buffer) => Promise<void>): void;
    onDisconnect(cb: () => Promise<void>): void;
};

export type WebSocketHandler = (request: RequestParams) => ((ws: WebSocketConnection) => Promise<void>) | null;
export type MethodHandler = (request: Request) => Promise<Response>;

export type Endpoint = {
    path: string;
    methods: {
        get?: Method | MethodHandler;
        post?: Method | MethodHandler;
        put?: Method | MethodHandler;
        del?: Method | MethodHandler;
        patch?: Method | MethodHandler;
        websocket?: WebSocketHandler;
    },
    subpaths?: Endpoint | Endpoint[];
}

export interface HttpService {
    registerEndpoint(endpoint: Endpoint): void;

    listen(port?: number): Promise<HttpServiceClosable>;
}

export interface HttpServiceClosable {
    close(): Promise<void>;
}

export interface WebSocketClientConnection {
    onRead(cb: (buffer: Buffer) => Promise<void>): void;
    onError(cb: (error: unknown) => Promise<void>): void;
    onClose(cb: () => Promise<void>): void;
    write(buffer: Buffer): Promise<void>;
    close(): Promise<void>;
}

export interface HttpApiClient {
    put<T, R>(path: string, data: T): Promise<{ status: number, body: R }>;
    get<R>(path: string): Promise<{ status: number, body: R }>;
    getBuffer(path: string): Promise<{ status: number, body: Buffer }>
    webSocketOpen(url: string): Promise<WebSocketClientConnection | null>;
}
