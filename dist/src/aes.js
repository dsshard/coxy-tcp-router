"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const salt = '5c5376807c3259c4cc6bdae907c1167686bdae905ac531163259c4cc7c3259c4cc';
const iv = Buffer.from('6408f0ec69bec52f12fd38a0a9771eb9', 'hex');
function encrypt(text, password) {
    const key = crypto_1.default.scryptSync(password, salt, 32);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
exports.encrypt = encrypt;
function decrypt(text, password) {
    const key = crypto_1.default.scryptSync(password, salt, 32);
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
exports.decrypt = decrypt;
