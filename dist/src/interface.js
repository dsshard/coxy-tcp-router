"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseInterface = void 0;
const events_1 = __importDefault(require("events"));
const crypto_1 = require("./crypto");
class BaseInterface extends events_1.default {
    getSecretKey(socket) {
        return '';
    }
    encrypt(body, socket) {
        body = (0, crypto_1.encrypt)(body, this.getSecretKey(socket));
        return body;
    }
    decrypt(body, socket) {
        try {
            body = (0, crypto_1.decrypt)(body, this.getSecretKey(socket));
            return JSON.parse(body);
        }
        catch (ignore) {
            return null;
        }
    }
}
exports.BaseInterface = BaseInterface;
