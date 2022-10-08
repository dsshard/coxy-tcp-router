import { Aes256 } from '@coxy/aes-256'

import EventEmitter from 'events'
import { Socket } from 'net'

export class BaseInterface extends EventEmitter {
  private aes: Aes256
  constructor () {
    super()
    this.aes = new Aes256('5c5376807c3259c4cc6bdae907c1167686bdae905ac531163259c4cc7c3259c4cc')
  }

  protected getSecretKey (socket?: Socket): string {
    return ''
  }

  protected encrypt (body: string, socket?: Socket): string {
    body = this.aes.encrypt(body, this.getSecretKey(socket))
    return body
  }

  protected decrypt<T> (body: string, socket?: Socket): T {
    try {
      body = this.aes.decrypt(body, this.getSecretKey(socket))
      return JSON.parse(body)
    } catch (ignore) {
      return null
    }
  }
}
