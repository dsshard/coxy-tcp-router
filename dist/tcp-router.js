"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpRouter = void 0;
const net_1 = require("net");
const crypto_1 = __importDefault(require("crypto"));
const pipeline_1 = require("./pipeline");
const interface_1 = require("./interface");
const crypto_2 = require("./crypto");
class TcpRouter extends interface_1.BaseInterface {
    constructor(options) {
        super();
        this.routers = [];
        this.options = options;
        this.connectionsCount = 0;
        this.server = (0, net_1.createServer)((socket) => this.handleSocket(socket));
    }
    listen(callback) {
        this.server.listen(this.options.port, this.options.host || undefined, callback);
        this.on('close', () => { this.connectionsCount -= 1; });
        this.on('connect', () => { this.connectionsCount += 1; });
    }
    getSecretKey(socket) {
        return `${this.options.secret}${(socket === null || socket === void 0 ? void 0 : socket.secret) || ''}`;
    }
    async handleSocket(socket) {
        var _a, _b;
        const info = socket.address();
        if ((_a = this.options.whitelist) === null || _a === void 0 ? void 0 : _a.length) {
            if (!this.options.whitelist.includes(info.address)) {
                this.emit('error:whitelist', socket);
                socket.end();
                return;
            }
        }
        if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.maxConnections) {
            if (this.connectionsCount > this.options.maxConnections) {
                this.emit('error:maxConnections', socket);
                socket.end();
                return;
            }
        }
        this.handshake(socket);
    }
    handshake(socket) {
        socket.once('data', (socketData) => {
            const response = this.decrypt(socketData.toString(), socket);
            const rnd = Math.round(Date.now() / 1000 / 3);
            const key1 = (0, crypto_2.sha256)(rnd.toString() + this.getSecretKey(socket));
            const key2 = (0, crypto_2.sha256)((rnd + 1).toString() + this.getSecretKey(socket));
            if (!response || !response[key1]) {
                socket.end();
                return;
            }
            const prime = Buffer.from(response[key1], 'hex');
            const pub = Buffer.from(response[key2], 'hex');
            this.dh = crypto_1.default.createDiffieHellman(prime);
            this.dh.generateKeys();
            const data = {
                [key2]: this.dh.getPublicKey().toString('hex')
            };
            socket.write(this.encrypt(JSON.stringify(data)));
            socket.secret = this.dh.computeSecret(pub).toString('hex');
            this.emit('connect', socket);
            socket.on('data', (data) => this.handleSocketData(data, socket));
            socket.on('close', () => {
                socket.secret = '';
                this.emit('close', socket);
            });
        });
    }
    async handleSocketData(socketData, socket) {
        let request = null;
        try {
            const data = socketData.toString();
            request = this.decrypt(data, socket);
            this.emit('data', request === null || request === void 0 ? void 0 : request.body);
        }
        catch (error) {
            this.emit('error:parse', socketData.toString());
            console.error('Failed', error.message);
            return;
        }
        if (!request) {
            console.error('Failed', 'request is empty');
            return;
        }
        const router = this.routers[request.rout];
        let body;
        if (router) {
            const result = await router.execute({ request: request.body, rout: request.rout });
            body = result === null || result === void 0 ? void 0 : result.body;
        }
        let res = JSON.stringify({ body, uuid: request.uuid });
        res = this.encrypt(res, socket);
        socket.write(res);
    }
    use(rout, ...middlewares) {
        const pipe = (0, pipeline_1.Pipeline)();
        pipe.push(...middlewares);
        this.routers[(this.options.prefix || '') + rout] = pipe;
    }
}
exports.TcpRouter = TcpRouter;
