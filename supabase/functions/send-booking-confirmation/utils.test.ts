import { assertEquals } from 'jsr:@std/assert@1'
import {
  bookingCheckInPath,
  enterpriseAgendaPath,
  extractBookingLookup,
  formatBookingTimeLabel,
  isAuthorized,
} from './utils.ts'
import { buildTenantBookingNotificationEmail } from './email.ts'

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

Deno.test('enterpriseAgendaPath matches FE shape', () => {
  assertEquals(enterpriseAgendaPath('manoplo'), '/enterprise/manoplo/agenda')
})

Deno.test('buildTenantBookingNotificationEmail includes contact + agenda', () => {
  const email = buildTenantBookingNotificationEmail({
    tenantName: 'Manoplo',
    customerName: 'Ana',
    customerEmail: 'ana@example.com',
    customerPhone: '600111222',
    serviceName: 'Corte',
    dateLabel: 'lunes, 3 de noviembre de 2026',
    timeLabel: '10:30',
    agendaUrl: 'https://app.fastbook.es/enterprise/manoplo/agenda',
  })

  assertEquals(
    email.subject.includes('Ana') && email.subject.includes('10:30'),
    true,
  )
  assertEquals(email.text.includes('ana@example.com'), true)
  assertEquals(email.text.includes('600111222'), true)
  assertEquals(
    email.html.includes('https://app.fastbook.es/enterprise/manoplo/agenda'),
    true,
  )
})

Deno.test('buildTenantBookingNotificationEmail omits empty phone', () => {
  const email = buildTenantBookingNotificationEmail({
    tenantName: 'Manoplo',
    customerName: 'Ana',
    customerEmail: 'ana@example.com',
    customerPhone: null,
    serviceName: 'Corte',
    dateLabel: 'lunes, 3 de noviembre de 2026',
    timeLabel: '10:30',
    agendaUrl: 'https://app.fastbook.es/enterprise/manoplo/agenda',
  })

  assertEquals(email.text.includes('Teléfono:'), false)
  assertEquals(email.html.includes('Teléfono'), false)
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
