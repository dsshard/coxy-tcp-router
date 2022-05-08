import { BaseInterface } from './interface';
export interface TcpClientOptions {
    port: number;
    host?: string;
    secret: string;
    autoReconnect?: boolean;
    timeoutReconnect?: number;
    requestTimeout?: number;
}
export declare class TcpClient extends BaseInterface {
    private readonly client;
    private readonly options;
    private dh;
    private secret;
    private connectListener;
    private stack;
    private isClosed;
    constructor(options: TcpClientOptions);
    connect(): Promise<unknown>;
    close(): void;
    private reconnect;
    protected getSecretKey(): string;
    private handshake;
    private handleClientData;
    send(rout: string, body: any): Promise<any>;
}
