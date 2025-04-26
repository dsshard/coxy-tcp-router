import crypto from 'node:crypto'
import { type Server, type Socket, createServer } from 'node:net'

import { BaseInterface } from './interface'
import { createDefer } from './utils/defer'
import { type Context, type Middleware, Pipeline } from './utils/pipeline'

export interface TcpRouterOptions {
  port: number
  host?: string
  secret?: string
  whitelist?: readonly string[]
  maxConnections?: number
}
export interface HandshakeInitialBody {
  pub: string
  name?: string
}
export interface RequestBody<T = unknown> {
  uuid: string
  body: T
  rout: string
}
export interface ResponseBody<T = unknown> {
  uuid: string
  body?: T
  error?: string
}

declare module 'net' {
  interface Socket {
    secret?: string
    clientName?: string
    _buf?: Buffer
  }
}

type AnyPipe = Pipeline<Context<unknown, unknown>, unknown>

export class TcpServer extends BaseInterface {
  private readonly server: Server
  private readonly opts: TcpRouterOptions
  private readonly routers = new Map<string, AnyPipe>()
  private readonly active = new Set<Socket>()

  constructor(o: TcpRouterOptions) {
    super()
    this.opts = o
    this.server = createServer((s) => this.handleSocket(s))
  }

  listen(cb?: () => void) {
    const defer = createDefer<void>()
    this.server.listen(this.opts.port, this.opts.host, () => {
      this.emit('listening')
      defer.resolve()
      if (cb) cb()
    })

    return defer
  }

  protected getSecret(s?: Socket) {
    return `${this.opts.secret}${s?.secret ?? ''}`
  }

  // ---------------- socket lifecycle ----------------
  private handleSocket(s: Socket) {
    const ip = (s.remoteAddress ?? '').replace(/^::ffff:/, '')
    if (this.opts.whitelist && !this.opts.whitelist.includes(ip)) {
      this.emit('error:whitelist', s)
      return s.destroy()
    }
    if (this.opts.maxConnections && this.active.size >= this.opts.maxConnections) {
      this.emit('error:maxConnections', s)
      return s.destroy()
    }

    this.active.add(s)
    s.setKeepAlive(true)
    s._buf = Buffer.alloc(0)
    s.on('close', () => {
      this.active.delete(s)
      this.emit('close', s)
      s.removeAllListeners()
    })
    this.handshake(s)
  }

  /** Gracefully stop listening and destroy all active sockets */
  public close() {
    const defer = createDefer<void>()
    this.server.once('close', () => {
      setTimeout(defer.resolve)
    })
    this.server.close()

    for (const sock of this.active) {
      sock.destroy()
    }
    return defer
  }

  private deriveKey(shared: Buffer) {
    return crypto
      .createHmac('sha256', this.opts.secret || '')
      .update(shared)
      .digest('hex')
  }

  // ---------------- handshake ----------------
  private handshake(s: Socket) {
    const ecdh = crypto.createECDH('prime256v1')
    ecdh.generateKeys()
    const first = (raw: Buffer) => {
      s.off('data', first)
      const msg = raw.toString().trimEnd()
      let init: HandshakeInitialBody
      try {
        init = JSON.parse(msg)
      } catch {
        return s.destroy()
      }
      const shared = ecdh.computeSecret(Buffer.from(init.pub, 'hex'))
      s.secret = this.deriveKey(shared)
      s.clientName = init.name
      s.write(`${JSON.stringify({ pub: ecdh.getPublicKey('hex') })}\n`)
      this.emit('connect', s, init.name)
      s.on('data', (chunk) => this.readFrames(s, chunk))
    }
    s.on('data', first)
  }

  // ---------------- length‑prefix framed stream ----------------
  private readFrames(s: Socket, chunk: Buffer) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    s._buf = Buffer.concat([s._buf!, chunk])
    while (s._buf.length >= 4) {
      const len = s._buf.readUInt32BE(0)
      if (s._buf.length < 4 + len) break
      const payload = s._buf.subarray(4, 4 + len).toString('utf8')
      s._buf = s._buf.subarray(4 + len)
      void this.handleData(payload, s)
    }
  }

  private async handleData<Q = unknown, S = unknown>(cipher: string, s: Socket) {
    let req: RequestBody<Q>
    try {
      req = this.decrypt<RequestBody<Q>>(cipher, s)
    } catch {
      return
    }
    const route = req.rout?.toLowerCase()
    const pipe = this.routers.get(route) as Pipeline<Context<Q, S>, S> | undefined

    const res: ResponseBody<S> = { uuid: req.uuid }
    try {
      if (!pipe) throw new Error(`Route ${route} not found`)
      const { body } = await pipe.execute({ request: req.body, rout: route })
      res.body = body
    } catch (e) {
      res.error = (e as Error).message
    }

    const out = this.encrypt(JSON.stringify(res), s)
    const buf = Buffer.from(out, 'utf8')
    const frame = Buffer.allocUnsafe(4 + buf.length)
    frame.writeUInt32BE(buf.length, 0)
    buf.copy(frame, 4)
    s.write(frame)
  }

  // ------------- public -------------
  public use<Q = unknown, S = unknown>(r: string, ...mw: Middleware<Context<Q, S>>[]) {
    const p = Pipeline<Context<Q, S>, S>()
    p.push(...mw)
    this.routers.set(r.trim().toLowerCase(), p as AnyPipe)
  }
}
