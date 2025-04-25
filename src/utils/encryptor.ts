import crypto from 'crypto'
const ALG = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function toKey(hex: string) {
  return crypto.createHash('sha256').update(hex).digest()
}

export function encrypt(data: string, keyHex: string): string {
  const key = toKey(keyHex)
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const enc = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, enc, tag]).toString('base64')
}
export function decrypt(payload: string, keyHex: string): string {
  const raw = Buffer.from(payload, 'base64')
  const key = toKey(keyHex)
  const iv = raw.subarray(0, IV_LEN)
  const tag = raw.subarray(raw.length - TAG_LEN)
  const enc = raw.subarray(IV_LEN, raw.length - TAG_LEN)
  const decipher = crypto.createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
