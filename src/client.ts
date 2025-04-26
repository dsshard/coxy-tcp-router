import crypto from 'crypto'
import { Socket } from 'net'

import { BaseInterface } from './interface'
import { HandshakeInitialBody, RequestBody, ResponseBody } from './server'
import { checkInternet } from './utils/check-connection'
import { createDefer } from './utils/defer'

export interface TcpClientOptions {
  port: number
  host?: string
  secret?: string
  name?: string
  autoReconnect?: boolean
  timeoutReconnect?: number
  keepAlive?: boolean
}

type Pending<T> = { ts: number; defer: ReturnType<typeof createDefer<T>> }

export class TcpClient extends BaseInterface {
  protected getSecret(): string {
    return `${this.opt.secret}${this.secret}`
  }

  public sock!: Socket
  private readonly opt: TcpClientOptions
  private ecdh = crypto.createECDH('prime256v1')
  private secret = ''
  private buf = Buffer.alloc(0)
  public pending: Record<string, Pending<unknown>> = {}
  private mClosed = false
  private rTimer: NodeJS.Timeout | null = null
  private iTimer: NodeJS.Timeout | null = null
  private connected = createDefer<boolean>()
  private closed = true

  constructor(opt: TcpClientOptions) {
    super()
    this.opt = opt
  }

  // ---------- socket lifecycle ----------
  private spawn() {
    this.sock = new Socket()
    this.buf = Buffer.alloc(0)

    this.sock.on('error', (err: Error & { code: string }) => {
      if (err.code === 'ECONNRESET') {
        this.onClose()
        return
      }
      this.emit('error', err)
    })
    this.sock.on('close', () => this.onClose())
    this.sock.once('connect', () => this.sendHandshake())
    this.sock.on('data', (chunk) => this.onData(chunk))
  }

  private sendHandshake() {
    this.ecdh.generateKeys()
    const init: HandshakeInitialBody = { pub: this.ecdh.getPublicKey('hex'), name: this.opt.name }
    this.sock.write(JSON.stringify(init))
  }

  // ---------- framing ----------
  private onData(chunk: Buffer) {
    if (!this.secret) return this.onHandshake(chunk)

    this.buf = Buffer.concat([this.buf, chunk])
    while (this.buf.length >= 4) {
      const len = this.buf.readUInt32BE(0)
      if (this.buf.length < 4 + len) break
      const cipher = this.buf.subarray(4, 4 + len).toString('utf8')
      this.buf = this.buf.subarray(4 + len)
      if (this.closed) return
      this.onMessage(cipher)
    }
  }

  private onHandshake(chunk: Buffer) {
    const str = chunk.toString().trimEnd()
    let resp: HandshakeInitialBody
    try {
      resp = JSON.parse(str)
    } catch {
      this.sock.destroy()
      return
    }

    const shared = this.ecdh.computeSecret(Buffer.from(resp.pub, 'hex'))
    this.secret = crypto
      .createHmac('sha256', this.opt.secret || '')
      .update(shared)
      .digest('hex')
    this.connected.resolve(true)
    this.emit('connect')
  }

  private onMessage(raw: string) {
    let res: ResponseBody<unknown>
    try {
      res = this.decrypt<ResponseBody>(raw)
    } catch {
      return
    }

    const rec = this.pending[res.uuid]
    if (!rec) return

    if (res.error) {
      rec.defer.reject(new Error(res.error))
    } else {
      rec.defer.resolve(res.body)
    }
    delete this.pending[res.uuid]
  }

  // ---------- public API ----------
  public async connect(): Promise<boolean> {
    if (!this.closed) return this.connected
    this.closed = false
    this.mClosed = false
    this.connected = createDefer<boolean>()

    const status = await checkInternet()
    if (!status) {
      this.onClose()
      return
    }

    this.spawn()
    this.sock.connect(this.opt.port, this.opt.host)
    await this.connected
    if (this.opt.keepAlive) {
      this.sock.setKeepAlive(true, 1000) // 10 секунд
    }

    clearInterval(this.iTimer)
    this.iTimer = setInterval(() => {
      checkInternet().then((status) => {
        this.emit('internet', status)
        if (!status) {
          this.onClose()
        }
      })
    }, 5000)
    return true
  }

  private onClose() {
    clearInterval(this.iTimer)
    this.closed = true
    this.secret = ''

    Object.keys(this.pending).forEach((uuid) => {
      const rec = this.pending[uuid]
      rec.defer.reject(new Error('Client closed'))
      delete this.pending[uuid]
    })

    if (this.rTimer) return // already waiting
    if (this.mClosed || !this.opt.autoReconnect) return
    this.emit('close')

    this.rTimer = setTimeout(() => {
      this.rTimer = null
      void this.connect()
    }, this.opt.timeoutReconnect)
  }

  public close() {
    clearInterval(this.iTimer)
    this.mClosed = true
    if (this.rTimer) {
      clearTimeout(this.rTimer)
      this.rTimer = null
    }

    if (this.sock) {
      this.sock.removeAllListeners()
      this.sock.destroy()
    }
    this.closed = true
  }

  public async send<Res = unknown, Req = unknown>(rout = '', body = {} as Req): Promise<Res> {
    // если сокет закрыт (сервер упал/рестарт), переподключаемся принудительно
    if (this.closed && !this.mClosed) {
      await this.connect()
    }

    const uuid = crypto.randomUUID()
    const packet: RequestBody<Req> = { uuid, rout, body }
    const cipher = this.encrypt(JSON.stringify(packet))

    const defer = createDefer<Res>()
    this.pending[uuid] = { ts: Date.now(), defer: defer as unknown as Pending<unknown>['defer'] }

    const buf = Buffer.from(cipher, 'utf8')
    const frame = Buffer.allocUnsafe(4 + buf.length)
    frame.writeUInt32BE(buf.length, 0)
    buf.copy(frame, 4)

    this.sock.write(frame)

    return defer
  }
}
