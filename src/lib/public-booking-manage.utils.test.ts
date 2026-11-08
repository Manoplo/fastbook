import { describe, expect, it } from 'vitest'
import {
  buildPublicBookingManageUrl,
  isBookingIdParam,
  mapPublicBookingRpcError,
  parsePublicBookingRecord,
  publicBookingManagePath,
} from './public-booking-manage.utils'

describe('isBookingIdParam', () => {
  it('acepta UUID v4', () => {
    expect(isBookingIdParam('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rechaza slug u otros', () => {
    expect(isBookingIdParam('manoplo')).toBe(false)
    expect(isBookingIdParam(undefined)).toBe(false)
  })
})

describe('publicBookingManagePath / URL', () => {
  it('codifica slug e id', () => {
    expect(publicBookingManagePath('manoplo', 'abc-123')).toBe('/manoplo/abc-123')
    expect(
      buildPublicBookingManageUrl({
        origin: 'https://app.fastbook.es/',
        tenantSlug: 'manoplo',
        bookingId: 'abc-123',
      }),
    ).toBe('https://app.fastbook.es/manoplo/abc-123')
  })
})

describe('parsePublicBookingRecord', () => {
  it('mapea payload jsonb', () => {
    const parsed = parsePublicBookingRecord({
      id: 'b1',
      tenant_id: 't1',
      service_id: null,
      booking_date: '2026-11-10',
      start_time: '10:00:00',
      end_time: '11:00:00',
      customer_name: 'Ana',
      customer_email: 'ana@example.com',
      customer_phone: null,
      status: 'confirmed',
      notes: null,
      tenant_slug: 'manoplo',
      tenant_name: 'Manoplo',
      service_name: null,
      service_duration_minutes: null,
    })
    expect(parsed.customer_name).toBe('Ana')
    expect(parsed.service_id).toBeNull()
  })
})

describe('mapPublicBookingRpcError', () => {
  it('traduce códigos conocidos', () => {
    expect(mapPublicBookingRpcError('booking_slot_taken')).toContain('reservado')
    expect(mapPublicBookingRpcError('boom')).toContain('No se pudo')
  })
})
