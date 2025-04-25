import { Socket } from 'net';
import EventEmitter from 'events';

declare abstract class BaseInterface extends EventEmitter {
    protected abstract getSecret(sock?: unknown): string;
    protected encrypt(data: string, sock?: unknown): string;
    protected decrypt<T = unknown>(payload: string, sock?: unknown): T;
}

type Next = () => Promise<void> | void;
interface Context<TReq, TRes> {
    request: TReq;
    rout: string;
    body?: TRes;
}
type Middleware<T> = (ctx: T, next: Next) => Promise<void> | void;

interface TcpRouterOptions {
    port: number;
    host?: string;
    secret?: string;
    whitelist?: readonly string[];
    maxConnections?: number;
}
declare module 'net' {
    interface Socket {
        secret?: string;
        clientName?: string;
        _buf?: Buffer;
    }
}
declare class TcpServer extends BaseInterface {
    private readonly server;
    private readonly opts;
    private readonly routers;
    private readonly active;
    constructor(o: TcpRouterOptions);
    listen(cb?: () => void): Promise<void> & {
        resolve: (value: void | PromiseLike<void>) => void;
        reject: (reason?: unknown) => void;
    };
    protected getSecret(s?: Socket): string;
    private handleSocket;
    close(): Promise<void> & {
        resolve: (value: void | PromiseLike<void>) => void;
        reject: (reason?: unknown) => void;
    };
    private deriveKey;
    private handshake;
    private readFrames;
    private handleData;
    use<Q = unknown, S = unknown>(r: string, ...mw: Middleware<Context<Q, S>>[]): void;
}

interface TcpClientOptions {
    port: number;
    host?: string;
    secret?: string;
    name?: string;
    autoReconnect?: boolean;
    timeoutReconnect?: number;
    requestTimeout?: number;
    maxPending?: number;
}
declare class TcpClient extends BaseInterface {
    protected getSecret(): string;
    private sock;
    private readonly opt;
    private ecdh;
    private secret;
    private buf;
    private pending;
    private mClosed;
    private rTimer;
    private connected;
    private closed;
    constructor(opt: TcpClientOptions);
    private spawn;
    private sendHandshake;
    private onData;
    private onHandshake;
    private onMessage;
    connect(): Promise<boolean>;
    private onClose;
    close(): void;
    send<Res = unknown, Req = unknown>(rout?: string, body?: Req): Promise<Res>;
}

export { TcpClient, TcpServer };
