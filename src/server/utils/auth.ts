import type { CompatibilityEvent } from 'h3'
import * as jose from 'jose'

export async function verifyUser (event: CompatibilityEvent) {
  const { token } = useCookies(event)
  if (!token) return null

  const publicKey = await jose.importSPKI(useRuntimeConfig().publicKey, 'ES256')
  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: 'urn:roe.dev:issuer',
    audience: 'urn:roe.dev:audience',
  })
  return payload
}

export async function loginUser (
  event: CompatibilityEvent,
  claims: Record<string, string | boolean>
) {
  const privateKey = await jose.importPKCS8(
    useRuntimeConfig().privateKey,
    'ES256'
  )
  const jwt = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .setIssuer('urn:roe.dev:issuer')
    .setAudience('urn:roe.dev:audience')
    .setExpirationTime('1w')
    .sign(privateKey)

  setCookie(event, 'token', jwt)
}
