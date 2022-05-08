"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tcp_router_1 = require("../tcp-router");
const router = new tcp_router_1.TcpRouter({
    port: 1337,
    host: '127.0.0.1',
    secret: 'supersecretstring',
    whitelist: ['127.0.0.1']
});
router.on('connect', (socket) => {
    console.log('connect', socket.address());
});
router.on('close', (socket) => {
    console.log('close', socket.address());
});
router.on('whitelist', (socket) => {
    console.log(socket.address());
});
router.use('/app/test', async function (ctx, next) {
    ctx.body = 'test';
    next();
});
void router.listen();
