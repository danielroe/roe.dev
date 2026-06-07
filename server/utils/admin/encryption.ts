/**
 * AES-256-GCM envelope encryption for fields that need to live on a public
 * PDS but stay private to roe.dev. Used for unanswered AMA questions and
 * for invite slug/repo pairs.
 *
 * Wire format (single base64url string, no padding):
 *
 *   <version-byte> | <12-byte iv> | <ciphertext> | <16-byte auth tag>
 *
 * Version byte exists so we can rotate keys / algorithms later without
 * having to re-encrypt every record. Only `0x00` is defined today.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSION = 0x00
const IV_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32

let cachedKey: Buffer | null = null

function getKey (): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.NUXT_PDS_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('NUXT_PDS_ENCRYPTION_KEY is not configured; cannot encrypt/decrypt PDS-stored private fields.')
  }
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== KEY_LEN) {
    throw new Error(`NUXT_PDS_ENCRYPTION_KEY must decode to ${KEY_LEN} bytes; got ${buf.length}. Generate one with \`openssl rand -base64 32\`.`)
  }
  cachedKey = buf
  return buf
}

function toBase64Url (buf: Buffer): string {
  return buf.toString('base64url')
}

function fromBase64Url (s: string): Buffer {
  return Buffer.from(s, 'base64url')
}

export function encrypt (plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const envelope = Buffer.concat([Buffer.from([VERSION]), iv, ciphertext, tag])
  return toBase64Url(envelope)
}

export function decrypt (token: string): string {
  const envelope = fromBase64Url(token)
  if (envelope.length < 1 + IV_LEN + TAG_LEN) {
    throw new Error('Encrypted payload is too short to be valid.')
  }
  const version = envelope.readUInt8(0)
  if (version !== VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`)
  }
  const iv = envelope.subarray(1, 1 + IV_LEN)
  const tag = envelope.subarray(envelope.length - TAG_LEN)
  const ciphertext = envelope.subarray(1 + IV_LEN, envelope.length - TAG_LEN)

  const key = getKey()
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

/** Convenience: encrypt an object as JSON. */
export function encryptJSON (value: unknown): string {
  return encrypt(JSON.stringify(value))
}

/** Convenience: decrypt and parse as JSON, with a type assertion. */
export function decryptJSON<T> (token: string): T {
  return JSON.parse(decrypt(token)) as T
}
