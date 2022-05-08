"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tcp_client_1 = require("../tcp-client");
async function run() {
    const client = new tcp_client_1.TcpClient({
        port: 1337,
        secret: 'supersecretstring'
    });
    client.on('close', () => {
        console.log('close');
    });
    client.on('connect', () => {
        console.log('connect');
    });
    client.on('error', () => {
        console.log('error');
    });
    await client.connect();
    const response = await client.send('/app/test', { test: 123 });
    console.log(response);
}
run();
