import EventEmitter from 'node:events'

import { decrypt, encrypt } from './utils/encryptor'

export abstract class BaseInterface extends EventEmitter {
  protected abstract getSecret(sock?: unknown): string
  protected encrypt(data: string, sock?: unknown) {
    if (!this.getSecret(sock)) {
      return data
    }
    return encrypt(data, this.getSecret(sock))
  }

  protected decrypt<T = unknown>(payload: string, sock?: unknown): T {
    if (!this.getSecret(sock)) {
      return JSON.parse(payload)
    }
    return JSON.parse(decrypt(payload, this.getSecret(sock))) as T
  }
}
