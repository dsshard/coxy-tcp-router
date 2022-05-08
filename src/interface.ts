import EventEmitter from 'events'
import { decrypt, encrypt } from './crypto'
import { Socket } from 'net'

export class BaseInterface extends EventEmitter {
  protected getSecretKey (socket?: Socket): string {
    return ''
  }

  protected encrypt (body: string, socket?: Socket): string {
    body = encrypt(body, this.getSecretKey(socket))
    return body
  }

  protected decrypt<T> (body: string, socket?: Socket): T {
    try {
      body = decrypt(body, this.getSecretKey(socket))
      return JSON.parse(body)
    } catch (ignore) {
      return null
    }
  }
}
