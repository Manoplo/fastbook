/** Token opaco (32 hex) para vincular QR ↔ booking sin exponer PII. */
export function createCheckInToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function bookingCheckInPath(tenantSlug: string, checkInToken: string): string {
  return `/enterprise/${encodeURIComponent(tenantSlug)}/check-in/${encodeURIComponent(checkInToken)}`
}

export function buildBookingCheckInUrl(params: {
  origin: string
  tenantSlug: string
  checkInToken: string
}): string {
  const origin = params.origin.replace(/\/$/, '')
  return `${origin}${bookingCheckInPath(params.tenantSlug, params.checkInToken)}`
}
