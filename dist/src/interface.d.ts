/// <reference types="node" />
import EventEmitter from 'events';
import { Socket } from 'net';
export declare class BaseInterface extends EventEmitter {
    protected getSecretKey(socket?: Socket): string;
    protected encrypt(body: string, socket?: Socket): string;
    protected decrypt<T>(body: string, socket?: Socket): T;
}
