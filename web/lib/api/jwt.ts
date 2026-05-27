export type JwtRole = 'SALES_REP' | 'MANAGER'

export type JwtPayload = {
  sub: string
  email: string
  role: JwtRole
}

function base64UrlDecode(input: string): string {
  // Base64Url => Base64
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  // Pad to a multiple of 4
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payloadJson = base64UrlDecode(parts[1])
    const parsed = JSON.parse(payloadJson) as unknown
    if (!parsed || typeof parsed !== 'object') return null

    const obj = parsed as Record<string, unknown>
    const sub = obj.sub
    const email = obj.email
    const role = obj.role
    if (typeof sub !== 'string' || typeof email !== 'string') return null
    if (role !== 'SALES_REP' && role !== 'MANAGER') return null

    return { sub, email, role }
  } catch {
    return null
  }
}

