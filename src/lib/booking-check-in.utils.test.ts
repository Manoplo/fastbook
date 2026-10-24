import { describe, expect, it } from 'vitest'
import {
  bookingCheckInPath,
  buildBookingCheckInUrl,
  createCheckInToken,
} from './booking-check-in.utils'

describe('booking-check-in utils', () => {
  it('genera un token hex de 32 caracteres', () => {
    const token = createCheckInToken()
    expect(token).toMatch(/^[0-9a-f]{32}$/)
    expect(createCheckInToken()).not.toBe(token)
  })

  it('arma la ruta de check-in con slug y token', () => {
    expect(bookingCheckInPath('manoplo', 'abc123')).toBe(
      '/enterprise/manoplo/check-in/abc123',
    )
  })

  it('arma la URL absoluta sin barra final duplicada', () => {
    expect(
      buildBookingCheckInUrl({
        origin: 'https://booked.es/',
        tenantSlug: 'manoplo',
        checkInToken: 'deadbeef',
      }),
    ).toBe('https://booked.es/enterprise/manoplo/check-in/deadbeef')
  })
})
