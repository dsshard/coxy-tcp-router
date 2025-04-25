# @coxy/tcp-router

Type‑safe, encrypted TCP router for Node.js / TypeScript.  
*ECDH key‑exchange → AES‑256‑GCM → length‑prefix framing → middleware pipeline.*

---
## Features

* 🔐 **End‑to‑end encryption** – ECDH (prime256v1) handshake, per‑connection key.
* ⚡ **Zero‑copy framing** – `[UInt32BE length][ciphertext]`  → no splitting/merging bugs.
* 🛣️ **Middleware pipeline** – similar to Koa/Express, async/await.
* 🔄 **Auto‑reconnect & queue** – client transparently resends messages after restart.
* 📦 **Single‑file bundle** – outputs minified CJS + ESM + d.ts.

---
## Installation

```bash
npm i @coxy/tcp-router            # npm
```

```bash
yarn add @coxy/tcp-router            # yarn
```


---
## Quick start

### 1 · Server
```ts
import { TcpServer } from 'tcp-secure-router'

const server = new TcpServer({
  port: 1337,
  secret: 'supersecretstring',
  whitelist: ['127.0.0.1'],
})

server.use('/echo', async (ctx) => {
  ctx.body = ctx.request           // simply echo back
})

server.listen(() => console.log('🔌 listening'))
```

### 2 · Client
```ts
import { TcpClient } from 'tcp-secure-router'

(async () => {
  const client = new TcpClient({ port: 1337, secret: 'supersecretstring' })
  await client.connect()
  const res = await client.send('/echo', { ping: 1 })
  console.log(res) // → { ping: 1 }
})()
```

---
## Advanced usage

### Auto‑reconnect demo
```ts
// server.ts
const srv = new TcpServer({ port: 0, secret: 's' })
const PORT = await new Promise<number>(r => srv.listen(() => r((srv.address() as any).port)))

// client.ts
const cli = new TcpClient({ port: PORT, secret: 's' })
await cli.connect()

// kill & restart server — client.send() will queue, then flush after reconnect
```

---
## Scripts
| command         | description               |
|-----------------|---------------------------|
| `npm run dev`   | ts-node watcher (nodemon) |
| `npm run test`  | Jest + ts-jest            |
| `npm run build` | tsup → minified bundle    |

---
## FAQ

### Why not WebSocket?
Need pure TCP (load‑balanced behind Nginx stream, no HTTP upgrade), binary framing, and custom crypto.

### How big is the bundle?
<3 KB minified (both CJS & ESM) with Terser property‑mangling.

### License
MIT

