import { Socket } from 'net';
import { Middleware } from './pipeline';
import { BaseInterface } from './interface';
export interface TcpRouterOptions {
    port: number;
    host?: string;
    prefix?: string;
    secret: string;
    whitelist?: string[];
    maxConnections?: number;
}
export interface HandshakeInitialBody {
    [n: number]: string;
}
export interface RequestBody {
    uuid: string;
    body: any;
    rout: string;
}
export declare type ResponseBody = Omit<RequestBody, 'rout'>;
declare module 'net' {
    interface Socket {
        secret: string;
    }
}
export declare class TcpRouter extends BaseInterface {
    private server;
    private options;
    private routers;
    private dh;
    private connectionsCount;
    constructor(options: TcpRouterOptions);
    listen(callback?: any): void;
    protected getSecretKey(socket: Socket): string;
    private handleSocket;
    private handshake;
    private handleSocketData;
    use(rout: string, ...middlewares: Middleware<any>[]): void;
}
