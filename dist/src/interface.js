"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseInterface = void 0;
const events_1 = __importDefault(require("events"));
const aes_256_1 = require("@coxy/aes-256");
class BaseInterface extends events_1.default {
    constructor() {
        super();
        this.aes = new aes_256_1.Aes256('5c5376807c3259c4cc6bdae907c1167686bdae905ac531163259c4cc7c3259c4cc');
    }
    getSecretKey(socket) {
        return '';
    }
    encrypt(body, socket) {
        body = this.aes.encrypt(body, this.getSecretKey(socket));
        return body;
    }
    decrypt(body, socket) {
        try {
            body = this.aes.decrypt(body, this.getSecretKey(socket));
            return JSON.parse(body);
        }
        catch (ignore) {
            return null;
        }
    }
}
exports.BaseInterface = BaseInterface;
