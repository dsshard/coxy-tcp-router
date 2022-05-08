import crypto from 'crypto'

const salt = '5c5376807c3259c4cc6bdae907c1167686bdae905ac531163259c4cc7c3259c4cc'
const iv = Buffer.from('6408f0ec69bec52f12fd38a0a9771eb9', 'hex')

export function encrypt (text: string, password: string): string {
  const key = crypto.scryptSync(password, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex')
}

export function decrypt (text: string, password: string): string {
  const key = crypto.scryptSync(password, salt, 32)
  const encryptedText = Buffer.from(text, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function sha256 (input: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
}
