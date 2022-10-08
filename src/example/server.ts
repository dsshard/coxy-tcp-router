import { TcpRouter } from '../tcp-router'

const router = new TcpRouter({
  port: 1337,
  host: '127.0.0.1',
  secret: 'supersecretstring',
  whitelist: ['127.0.0.1'],
  maxConnections: 1
})

router.on('connect', (socket) => {
  // eslint-disable-next-line no-console
  console.log('connect', socket.address())
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

router.use('/app/test', async function (ctx, next) {
  // eslint-disable-next-line no-console
  console.log(ctx.request)
  ctx.body = 'test'
  next()
})

void router.listen()
