import { Socket } from 'net'
import crypto, { DiffieHellman } from 'crypto'
import { BaseInterface } from './interface'
import { HandshakeInitialBody, RequestBody, ResponseBody } from './tcp-router'
import { sha256 } from './crypto'

export interface TcpClientOptions {
  port: number,
  host?: string
  secret: string,
  autoReconnect?: boolean
  timeoutReconnect?: number,
  requestTimeout?: number
}

const defer = () => {
  const bag = {}
  return Object.assign(
    new Promise((resolve, reject) => Object.assign(bag, { resolve, reject })),
    bag
  )
}

export class TcpClient extends BaseInterface {
  private client: Socket;
  private options: TcpClientOptions;
  private dh: DiffieHellman;
  private secret = '';
  private connectListener: any = null;
  private stack: any = {}
  private isClosed = false;

  constructor (options: TcpClientOptions) {
    super()
    this.options = options
    this.client = new Socket()

    this.client.on('close', async () => {
      if (this.isClosed) return
      this.emit('close')
      void this.reconnect()
    })

    this.client.on('error', (e) => {
      this.emit('error', e)
    })
  }

  public async connect () {
    return new Promise(resolve => {
      if (this.connectListener) {
        this.client.removeListener('connect', this.connectListener)
      }
      this.connectListener = async () => {
        this.isClosed = false
        await this.handshake()
        this.emit('connect')
        resolve(true)
      }
      this.client.once('connect', this.connectListener)
      this.client.connect(this.options.port, this.options.host)
      this.client.on('data', (data) => {
        if (!this.secret) return
        this.handleClientData(data.toString())
      })
    })
  }

  public close () {
    this.isClosed = true
    this.client.end()
    this.client.destroy()
  }

  private reconnect () {
    if (this.options.autoReconnect !== false) {
      setTimeout(() => {
        if (this.isClosed) return
        void this.connect()
      }, this.options.timeoutReconnect || 1000)
    }
  }

  protected getSecretKey () {
    return `${this.options.secret}${this.secret}`
  }

  private async handshake () {
    this.secret = ''

    return new Promise((resolve) => {
      const server = crypto.createDiffieHellman(512)
      const prime = server.getPrime()
      this.dh = crypto.createDiffieHellman(prime)
      this.dh.generateKeys()

      const rnd = Math.round(Date.now() / 1000 / 3)
      const key1 = sha256(rnd.toString() + this.getSecretKey())
      const key2 = sha256((rnd + 1).toString() + this.getSecretKey())

      let body = JSON.stringify(<HandshakeInitialBody> {
        [key1]: prime.toString('hex'),
        [key2]: this.dh.getPublicKey().toString('hex')
      })

      body = this.encrypt(body)
      this.client.once('data', (socketData) => {
        const data = socketData.toString()
        const response = this.decrypt<HandshakeInitialBody>(data)

        if (!response) {
          this.close()
          return
        }
        const pub = Buffer.from(response[key2], 'hex')
        this.secret = this.dh.computeSecret(pub).toString('hex')

        this.client.on('close', () => {
          this.client.secret = ''
          this.emit('close', this.client)
        })

        resolve(null)
      })
      this.client.write(body)
    })
  }

  private async handleClientData (data: string) {
    const response = this.decrypt<ResponseBody>(data)
    // remove old deffer
    const maxTime = this.options.requestTimeout || 10000

    for (const uuid in this.stack) {
      const item = this.stack[uuid]
      if (item.time + maxTime > Date.now()) {
        this.stack[item.uuid].defer.reject('timeout')
        delete this.stack[item.uuid]
      }
    }

    if (response?.uuid && this.stack[response.uuid]) {
      this.stack[response.uuid].defer.resolve(response.body)
      delete this.stack[response.uuid]
    }
  }

  public async send (rout: string, body) {
    const uuid = Math.random().toString()
    const data: RequestBody = { rout, body, uuid }
    this.stack[uuid] = { defer: defer(), time: Date.now() }
    this.client.write(this.encrypt(JSON.stringify(data)))
    return this.stack[uuid].defer
  }
}
