// server.ts

import { TcpServer } from '../server'

const router = new TcpServer({
  port: 1337,
  host: '127.0.0.1',
  secret: 'supersecretstring',
  whitelist: ['127.0.0.1'],
  maxConnections: 1,
})

router.on('connect', (socket) => {
  // eslint-disable-next-line no-console
  console.log('connect', socket.address(), socket.clientName)
})
router.on('close', (socket) => {
  // eslint-disable-next-line no-console
  console.log('close', socket.address())
})
router.on('error:whitelist', (socket) => {
  // eslint-disable-next-line no-console
  console.log(socket.address())
})
router.on('error:maxConnections', (socket) => {
  // eslint-disable-next-line no-console
  console.log(socket.address())
})

router.use('/app/test', async (ctx, next) => {
  ctx.body = `test${Math.random()}`
  next()
})

void router.listen()
