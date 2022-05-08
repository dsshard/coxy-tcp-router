"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpClient = void 0;
const net_1 = require("net");
const crypto_1 = __importDefault(require("crypto"));
const interface_1 = require("./interface");
const crypto_2 = require("./crypto");
const defer = () => {
    const bag = {};
    return Object.assign(new Promise((resolve, reject) => Object.assign(bag, { resolve, reject })), bag);
};
class TcpClient extends interface_1.BaseInterface {
    constructor(options) {
        super();
        this.secret = '';
        this.connectListener = null;
        this.stack = {};
        this.isClosed = false;
        this.options = options;
        this.client = new net_1.Socket();
        this.client.on('close', async () => {
            if (this.isClosed)
                return;
            this.emit('close');
            void this.reconnect();
        });
        this.client.on('error', (e) => {
            this.emit('error', e);
        });
    }
    async connect() {
        return new Promise(resolve => {
            if (this.connectListener) {
                this.client.removeListener('connect', this.connectListener);
            }
            this.connectListener = async () => {
                this.isClosed = false;
                await this.handshake();
                this.emit('connect');
                resolve(true);
            };
            this.client.once('connect', this.connectListener);
            this.client.connect(this.options.port, this.options.host);
            this.client.on('data', (data) => {
                if (!this.secret)
                    return;
                this.handleClientData(data.toString());
            });
        });
    }
    close() {
        this.isClosed = true;
        this.client.end();
        this.client.destroy();
    }
    reconnect() {
        if (this.options.autoReconnect !== false) {
            setTimeout(() => {
                if (this.isClosed)
                    return;
                void this.connect();
            }, this.options.timeoutReconnect || 1000);
        }
    }
    getSecretKey() {
        return `${this.options.secret}${this.secret}`;
    }
    async handshake() {
        this.secret = '';
        return new Promise((resolve) => {
            const server = crypto_1.default.createDiffieHellman(512);
            const prime = server.getPrime();
            this.dh = crypto_1.default.createDiffieHellman(prime);
            this.dh.generateKeys();
            const rnd = Math.round(Date.now() / 1000 / 3);
            const key1 = (0, crypto_2.sha256)(rnd.toString() + this.getSecretKey());
            const key2 = (0, crypto_2.sha256)((rnd + 1).toString() + this.getSecretKey());
            let body = JSON.stringify({
                [key1]: prime.toString('hex'),
                [key2]: this.dh.getPublicKey().toString('hex')
            });
            body = this.encrypt(body);
            this.client.once('data', (socketData) => {
                const data = socketData.toString();
                const response = this.decrypt(data);
                if (!response) {
                    this.close();
                    return;
                }
                const pub = Buffer.from(response[key2], 'hex');
                this.secret = this.dh.computeSecret(pub).toString('hex');
                this.client.on('close', () => {
                    this.client.secret = '';
                    this.emit('close', this.client);
                });
                resolve(null);
            });
            this.client.write(body);
        });
    }
    async handleClientData(data) {
        const response = this.decrypt(data);
        const maxTime = this.options.requestTimeout || 10000;
        for (const uuid in this.stack) {
            const item = this.stack[uuid];
            if (item.time + maxTime < Date.now()) {
                this.stack[uuid].defer.reject('timeout');
                delete this.stack[uuid];
            }
        }
        if ((response === null || response === void 0 ? void 0 : response.uuid) && this.stack[response.uuid]) {
            this.stack[response.uuid].defer.resolve(response.body);
            delete this.stack[response.uuid];
        }
    }
    async send(rout, body) {
        const uuid = Math.random().toString();
        const data = { rout, body, uuid };
        this.stack[uuid] = { defer: defer(), time: Date.now() };
        this.client.write(this.encrypt(JSON.stringify(data)));
        return this.stack[uuid].defer;
    }
}
exports.TcpClient = TcpClient;
