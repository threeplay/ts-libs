import {Observability} from "@threeplay/observability";
import {Endpoint, HttpService, HttpServiceClosable, Method, MethodHandler, WebSocketHandler} from "@threeplay/http";
import express, {Application, Request as ExpressRequest, Response as ExpressResponse} from "express";
import {Server} from "net";
import * as WebSocket from "ws";
import {Lists} from "@threeplay/collections";
import {IncomingHttpHeaders} from "http";

export type HttpServerOptions = { maxContentLength: number };

const Logger = Observability.for('http').getLogger('express');

export class ExpressHttpService implements HttpService {
    public static create(options: HttpServerOptions): HttpService {
        return new ExpressHttpService(options);
    }

    private readonly app: Application;
    private readonly websocketEndpoints = new Map<string, WebSocketHandler>();

    constructor(options: HttpServerOptions) {
        this.app = express();
        this.app.use(express.raw({ type: 'application/octet-stream', limit: options.maxContentLength }));
        this.app.use(express.json({ type: 'application/json', limit: options.maxContentLength }));
    }

    public registerEndpoint(endpoints: Endpoint | Endpoint[]): void {
        for (const endpoint of Array.isArray(endpoints) ? endpoints : [endpoints]) {
            if (endpoint.methods.get) {
                this.app.get(endpoint.path, this.wrapHandler(endpoint.methods.get));
            }
            if (endpoint.methods.put) {
                this.app.put(endpoint.path, this.wrapHandler(endpoint.methods.put));
            }
            if (endpoint.methods.post) {
                this.app.post(endpoint.path, this.wrapHandler(endpoint.methods.post));
            }
            if (endpoint.methods.del) {
                this.app.delete(endpoint.path, this.wrapHandler(endpoint.methods.del));
            }
            if (endpoint.methods.patch) {
                this.app.patch(endpoint.path, this.wrapHandler(endpoint.methods.patch));
            }
            if (endpoint.methods.websocket) {
                this.websocketEndpoints.set(endpoint.path, endpoint.methods.websocket);
            }
            if (endpoint.subpaths) {
                for (const subpath of Array.isArray(endpoint.subpaths) ? endpoint.subpaths : [endpoint.subpaths]) {
                    this.registerEndpoint({
                        ...subpath,
                        path: joinPaths(endpoint.path, subpath.path),
                    });
                }
            }
        }
    }

    public async listen(port?: number): Promise<HttpServiceClosable> {
        Logger.info(`Starting at port: ${port}`);
        const server = this.app.listen(port);
        this.setupWebSocket(server);
        return {
            close: async () =>
                new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
        };
    }

    private setupWebSocket(server: Server) {
        const wss = new WebSocket.Server({ noServer: true });
        server.on('upgrade', (request, socket, head) => {
            const { handler, params } = this.websocketHandler(String(request.url));
            const headers = Object.fromEntries(Lists.pairs(request.rawHeaders as string[])
                .map(([key, value]) => [key.toLowerCase(), value]));
            const acceptedHandler = handler?.({ headers, params, query: {} });
            if (acceptedHandler) {
                wss.handleUpgrade(request, socket as any, head, ws => {
                    acceptedHandler({
                        onDisconnect: cb => {
                            ws.on('close', () => cb());
                        },
                        onRead: cb => {
                            ws.on('message', (_: any, data: WebSocket.RawData, isBinary: boolean) => {
                                cb(Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data)).catch()
                            });
                        },
                        write: async buffer =>
                            new Promise((resolve, reject) => ws.send(buffer, err => err ? reject(err) : resolve())),
                        close: async () => socket.end(),
                    }).catch(e => {
                        Logger.error(`Error occurred while handling websocket creation: ${e.message}`);
                        socket.end();
                    });
                });
            } else {
                if (!handler) {
                    Logger.error(`Endpoint doesn't support websocket: ${String(request.url)}`);
                } else {
                    Logger.error(`Websocket connection refused: ${String(request.url)} [${JSON.stringify(request.rawHeaders)}]`);
                }
                socket.end();
            }
        });
    }

    private websocketHandler(path: string): { handler: WebSocketHandler | null, params: { [key: string]: string } } {
        const components = path.split('/');
        for (const [pathTemplate, handler] of this.websocketEndpoints.entries()) {
            const templateComponents = pathTemplate.split('/');
            if (templateComponents.length === components.length) {
                const params: { [key: string]: string } = {};
                let matched = true;
                for (let i = 0; i < templateComponents.length && matched; i++) {
                    const template = templateComponents[i];
                    if (template.startsWith(':')) {
                        params[template.slice(1)] = components[i];
                    } else if (template !== components[i]) {
                        matched = false;
                    }
                }
                if (matched) {
                    return {
                        params,
                        handler,
                    };
                }
            }
        }

        return { handler: null, params: {} };
    }

    private wrapHandler(methodHandler: Method | MethodHandler): (req: ExpressRequest, res: ExpressResponse) => void {
        const handler = typeof methodHandler === 'function' ? methodHandler : methodHandler.handler;
        return (req, res) => {
            Logger.debug(`Handling request: ${req.method} ${req.path} [${JSON.stringify(req.params)}]`);
            handler({
                params: req.params,
                headers: mapHeaders(req.headers),
                query: {},
                bodyBuffer: () => req.body,
                bodyJson: () => req.body,
            }).then(response => {
                Logger.debug(`Response: [${response.status}]: ${JSON.stringify(response)}`);
                if (response.json) {
                    res.status(response.status ?? 200).json(response.json).end();
                } else if (response.buffer) {
                    res.status(response.status ?? 200).send(response.buffer).end();
                } else {
                    res.status(response.status ?? 200).end();
                }
            }, error => {
                Logger.error(`Error occurred: ${error.message} [${req.method} ${req.path}]`);
                res.status(500).json({ error: error.message }).end();
            });
        };
    }
}

function mapHeaders(headers: IncomingHttpHeaders): Record<string, string> {
    return Object.fromEntries(Object.entries(headers)
        .filter(([, value]) => typeof value !== 'undefined')
        .map(([key, value]) =>
            [key, Array.isArray(value) ? value.join(';') : value ?? '']
        ));
}

function joinPaths(base: string, path: string): string {
    const pathWithoutInitialSlash = path.startsWith('/') ? path.slice(1) : path;
    const baseWithoutFinalSlash = base.endsWith('/') ? path.slice(0, -1) : path;
    return `${baseWithoutFinalSlash}/${pathWithoutInitialSlash}`;
}