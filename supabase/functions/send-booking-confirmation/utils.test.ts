import { assertEquals } from 'jsr:@std/assert@1'
import {
  bookingCheckInPath,
  extractBookingLookup,
  formatBookingTimeLabel,
  isAuthorized,
} from './utils.ts'

Deno.test('extractBookingLookup from webhook INSERT', () => {
  assertEquals(
    extractBookingLookup({
      type: 'INSERT',
      table: 'bookings',
      record: { id: 'booking-1' },
    }),
    { kind: 'id', bookingId: 'booking-1' },
  )
})

Deno.test('extractBookingLookup from checkInToken (cliente)', () => {
  assertEquals(
    extractBookingLookup({ checkInToken: 'abc123' }),
    { kind: 'token', checkInToken: 'abc123' },
  )
})

Deno.test('extractBookingLookup from manual bookingId', () => {
  assertEquals(extractBookingLookup({ bookingId: 'booking-2' }), {
    kind: 'id',
    bookingId: 'booking-2',
  })
})

Deno.test('extractBookingLookup rejects unrelated payload', () => {
  assertEquals(
    extractBookingLookup({
      type: 'UPDATE',
      table: 'bookings',
      record: { id: 'x' },
    }),
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

Deno.test('isAuthorized accepts bearer, header, or client checkInToken', () => {
  const secret = 'test-secret'
  const longToken = 'a'.repeat(32)

  assertEquals(
    isAuthorized(
      new Request('http://localhost', {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      secret,
      {},
    ),
    true,
  )
  assertEquals(
    isAuthorized(
      new Request('http://localhost', {
        headers: { 'x-booking-webhook-secret': secret },
      }),
      secret,
      {},
    ),
    true,
  )
  assertEquals(
    isAuthorized(new Request('http://localhost'), secret, {
      checkInToken: longToken,
    }),
    true,
  )
  assertEquals(
    isAuthorized(new Request('http://localhost'), secret, {
      checkInToken: 'short',
    }),
    false,
  )
  assertEquals(isAuthorized(new Request('http://localhost'), secret, {}), false)
})
