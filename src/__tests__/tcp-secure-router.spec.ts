import { TcpClient } from '../client'
import { TcpServer } from '../server'

const PORT = 15000
const SECRET = 'unit-test-secret'

async function createServer() {
  const server = new TcpServer({ port: PORT, secret: SECRET, host: '127.0.0.1', whitelist: ['127.0.0.1'] })
  server.use('/echo', async (ctx) => {
    ctx.body = ctx.request
  })
  await server.listen()
  return server
}

test('client ↔ server round‑trip works', async () => {
  const server = await createServer()
  const client = new TcpClient({ port: PORT, secret: SECRET, name: 'jest' })
  await client.connect()
  const res = await client.send('/echo', { ping: 1 })
  expect(res).toEqual({ ping: 1 })
  client.close()
  server.close()
})

test('unknown route returns error', async () => {
  const server = await createServer()
  const client = new TcpClient({ port: PORT, secret: SECRET })
  await client.connect()
  await expect(client.send('/nope', {})).rejects.toThrow('Route /nope not found')
  client.close()
  server.close()
})

test('check server down', async () => {
  const server = await createServer()
  const client = new TcpClient({ port: PORT, secret: SECRET })
  await client.connect()
  let res = await client.send('/echo', { ping: 1 })
  client.on('error', () => {})
  expect(res).toEqual({ ping: 1 })

  await server.close()
  await server.listen()

  res = await client.send('/echo', { ping: 1 })
  expect(res).toEqual({ ping: 1 })

  client.close()
  server.close()
}, 1000)

test('unknown route returns error', async () => {
  const server = await createServer()
  const client = new TcpClient({ port: PORT, secret: SECRET })
  await client.connect()
  const res = await client.send('/echo')
  expect(res).toEqual({})
  client.close()
  server.close()
})

test('unknown route returns error', async () => {
  const server = await createServer()
  const client = new TcpClient({ port: PORT, secret: SECRET })
  await client.connect()
  await expect(client.send()).rejects.toThrow('Route  not found')
  client.close()
  server.close()
})

test('unknown route returns error', async () => {
  const server = new TcpServer({ port: PORT })
  server.use('/echo', async (ctx) => {
    ctx.body = ctx.request
  })
  await server.listen()
  const client = new TcpClient({ port: PORT })
  await client.connect()
  await expect(client.send()).rejects.toThrow('Route  not found')
  client.close()
  server.close()
})
