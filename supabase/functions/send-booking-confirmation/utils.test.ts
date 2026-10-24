import { assertEquals } from 'jsr:@std/assert@1'
import {
  bookingCheckInPath,
  extractBookingId,
  formatBookingTimeLabel,
  isAuthorized,
} from './utils.ts'

Deno.test('extractBookingId from webhook INSERT', () => {
  assertEquals(
    extractBookingId({
      type: 'INSERT',
      table: 'bookings',
      record: { id: 'booking-1' },
    }),
    'booking-1',
  )
})

Deno.test('extractBookingId from manual invoke', () => {
  assertEquals(extractBookingId({ bookingId: 'booking-2' }), 'booking-2')
})

Deno.test('extractBookingId rejects unrelated payload', () => {
  assertEquals(
    extractBookingId({ type: 'UPDATE', table: 'bookings', record: { id: 'x' } }),
    null,
  )
})

Deno.test('bookingCheckInPath matches FE shape', () => {
  assertEquals(
    bookingCheckInPath('manoplo', 'abc'),
    '/enterprise/manoplo/check-in/abc',
  )
})

Deno.test('formatBookingTimeLabel trims seconds', () => {
  assertEquals(formatBookingTimeLabel('09:30:00'), '09:30')
})

Deno.test('isAuthorized accepts bearer or custom header', () => {
  const secret = 'test-secret'
  assertEquals(
    isAuthorized(
      new Request('http://localhost', {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      secret,
    ),
    true,
  )
  assertEquals(
    isAuthorized(
      new Request('http://localhost', {
        headers: { 'x-booking-webhook-secret': secret },
      }),
      secret,
    ),
    true,
  )
  assertEquals(
    isAuthorized(new Request('http://localhost'), secret),
    false,
  )
  assertEquals(
    isAuthorized(
      new Request('http://localhost', {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      undefined,
    ),
    false,
  )
})
