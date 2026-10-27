import { assertEquals } from 'jsr:@std/assert@1'
import {
  bookingCheckInPath,
  extractBearerToken,
  formatBookingTimeLabel,
} from './utils.ts'
import { buildBookingReminderEmail } from './email.ts'

Deno.test('bookingCheckInPath matches FE shape', () => {
  assertEquals(
    bookingCheckInPath('manoplo', 'abc'),
    '/enterprise/manoplo/check-in/abc',
  )
})

Deno.test('formatBookingTimeLabel trims seconds', () => {
  assertEquals(formatBookingTimeLabel('09:30:00'), '09:30')
})

Deno.test('extractBearerToken reads Authorization header', () => {
  assertEquals(
    extractBearerToken(
      new Request('http://localhost', {
        headers: { Authorization: 'Bearer secret-value' },
      }),
    ),
    'secret-value',
  )
  assertEquals(extractBearerToken(new Request('http://localhost')), null)
})

Deno.test('buildBookingReminderEmail mentions tomorrow reminder', () => {
  const email = buildBookingReminderEmail({
    tenantName: 'Manoplo',
    customerName: 'Ana',
    serviceName: 'Corte',
    dateLabel: 'miércoles, 28 de octubre de 2026',
    timeLabel: '10:30',
    checkInUrl: 'https://app.fastbook.es/enterprise/manoplo/check-in/tok',
  })

  assertEquals(email.subject.includes('Recordatorio'), true)
  assertEquals(email.text.includes('10:30'), true)
  assertEquals(email.html.includes('cid:booking-qr'), true)
})
