import crypto from 'crypto'

export function sha256 (input: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
}
