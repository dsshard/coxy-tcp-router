### Client

```javascript

async function run () {
  const client = new TcpClient({
    port: 1337,
    secret: 'supersecretstring'
  })
  client.on('close', () => {
    console.log('close')
  })
  client.on('connect', () => {
    console.log('connect')
  })
  client.on('error', () => {
    console.log('error')
  })

  await client.connect()
  const response = await client.send('/app/test', { test: 123 })
  console.log(response)
}

run()

```

### Server

```javascript

const router = new TcpRouter({
  port: 1337,
  host: '127.0.0.1',
  secret: 'supersecretstring',
  whitelist: ['127.0.0.1']
})

router.on('connect', (socket) => {
  console.log('connect', socket.address())
})
router.on('close', (socket) => {
  console.log('close', socket.address())
})
router.on('whitelist', (socket) => {
  console.log(socket.address())
})

router.use('/app/test', async function (ctx, next) {
  ctx.body = 'test'
  next()
})

router.listen()

```
