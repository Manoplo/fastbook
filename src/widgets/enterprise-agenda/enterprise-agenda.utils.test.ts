import { describe, expect, it } from 'vitest'
import type { TenantBookingRow } from '@src/lib/tenant-bookings'
import {
  addDays,
  bookingMatchesSearch,
  countAgendaByStatus,
  deriveAgendaUiStatus,
  durationMinutesBetween,
  filterAgendaBookings,
  formatActiveRangeLabel,
  formatAgendaDateLabel,
  formatAgendaPrice,
  formatBookingRef,
  formatTimeHhMm,
  resolveBookingsQueryRange,
  startOfDay,
  sumProjectedRevenue,
  toAgendaBookingCard,
  whatsappHref,
} from './enterprise-agenda.utils'
import type { AgendaBookingCardModel } from './enterprise-agenda.types'

function makeBooking(
  overrides: Partial<TenantBookingRow> &
    Pick<TenantBookingRow, 'booking_date' | 'start_time' | 'end_time'>,
): TenantBookingRow {
  return {
    id: 'b662805b-b796-403f-a37c-a8302ba934a3',
    tenant_id: 'tenant-1',
    service_id: 'service-1',
    customer_name: 'Manuel Martín',
    customer_email: 'manuel@example.com',
    customer_phone: '+34 679427903',
    status: 'confirmed',
    check_in_token: 'a1b2c3d4e5f6789012345678abcdef01',
    created_at: '2026-10-12T00:00:00Z',
    notes: null,
    service: {
      id: 'service-1',
      name: 'Creación de aplicación web',
      price: 400,
      duration_minutes: 60,
    },
    ...overrides,
  }
}

function makeCard(
  overrides: Partial<AgendaBookingCardModel> = {},
): AgendaBookingCardModel {
  return {
    id: 'b662805b-b796-403f-a37c-a8302ba934a3',
    bookingDate: '2026-10-16',
    startTime: '13:00:00',
    endTime: '14:00:00',
    durationMinutes: 60,
    customerName: 'Chico Matuli',
    customerEmail: 'chicomatuli@example.com',
    customerPhone: '+34 68345843',
    notes: null,
    serviceName: 'Creación de aplicación web',
    price: 400,
    dbStatus: 'confirmed',
    uiStatus: 'confirmed',
    refLabel: '#FB-B6628',
    ...overrides,
  }
}

describe('formatAgendaDateLabel', () => {
  it('formats a full Spanish date label', () => {
    const date = startOfDay(new Date(2024, 9, 24))
    expect(formatAgendaDateLabel(date)).toBe('Jueves, 24 de Octubre de 2024')
  })
})

describe('addDays', () => {
  it('moves the selected day forward and backward', () => {
    const base = startOfDay(new Date(2024, 9, 24))
    expect(addDays(base, 1).getDate()).toBe(25)
    expect(addDays(base, -1).getDate()).toBe(23)
  })
})

describe('time helpers', () => {
  it('formats HH:MM and duration', () => {
    expect(formatTimeHhMm('13:00:00')).toBe('13:00')
    expect(durationMinutesBetween('13:00:00', '14:00:00')).toBe(60)
  })

  it('formats euro prices without cents when integer', () => {
    expect(formatAgendaPrice(400)).toMatch(/400/)
    expect(formatAgendaPrice(400)).toMatch(/€/)
  })

  it('builds a short booking ref', () => {
    expect(formatBookingRef('b662805b-b796-403f-a37c-a8302ba934a3')).toBe('#FB-B6628')
  })
})

describe('deriveAgendaUiStatus', () => {
  const booking = makeBooking({
    booking_date: '2026-10-16',
    start_time: '13:00:00',
    end_time: '14:00:00',
  })

  it('keeps future confirmed bookings as confirmed', () => {
    expect(deriveAgendaUiStatus(booking, new Date(2026, 9, 16, 10, 0, 0))).toBe(
      'confirmed',
    )
  })

  it('marks a booking as in progress during its window', () => {
    expect(deriveAgendaUiStatus(booking, new Date(2026, 9, 16, 13, 30, 0))).toBe(
      'in_progress',
    )
  })

  it('marks a booking as completed after it ends', () => {
    expect(deriveAgendaUiStatus(booking, new Date(2026, 9, 16, 15, 0, 0))).toBe(
      'completed',
    )
  })

  it('keeps cancelled status', () => {
    expect(
      deriveAgendaUiStatus(
        { ...booking, status: 'cancelled' },
        new Date(2026, 9, 16, 13, 30, 0),
      ),
    ).toBe('cancelled')
  })
})

describe('toAgendaBookingCard + filters', () => {
  it('maps a row into a card model', () => {
    const card = toAgendaBookingCard(
      makeBooking({
        booking_date: '2026-10-16',
        start_time: '17:00:00',
        end_time: '18:00:00',
        customer_name: 'Elena Morales',
      }),
      new Date(2026, 9, 12, 12, 0, 0),
    )

    expect(card.customerName).toBe('Elena Morales')
    expect(card.serviceName).toBe('Creación de aplicación web')
    expect(card.uiStatus).toBe('confirmed')
    expect(card.durationMinutes).toBe(60)
    expect(card.price).toBe(400)
  })

  it('filters by search and status', () => {
    const cards = [
      makeCard({ id: '1', customerName: 'Chico Matuli', uiStatus: 'confirmed' }),
      makeCard({
        id: '2',
        customerName: 'Elena Morales',
        uiStatus: 'confirmed',
        customerPhone: null,
      }),
      makeCard({ id: '3', customerName: 'Cancelado', uiStatus: 'cancelled' }),
    ]

    expect(filterAgendaBookings(cards, { statusFilter: 'confirmed', search: '' })).toHaveLength(
      2,
    )
    expect(
      filterAgendaBookings(cards, { statusFilter: 'all', search: 'elena' }),
    ).toHaveLength(1)
    expect(bookingMatchesSearch(cards[0]!, 'matuli')).toBe(true)
  })

  it('counts statuses and projected revenue', () => {
    const cards = [
      makeCard({ id: '1', price: 400, uiStatus: 'confirmed' }),
      makeCard({ id: '2', price: 400, uiStatus: 'confirmed' }),
      makeCard({ id: '3', price: 100, uiStatus: 'cancelled' }),
    ]

    expect(countAgendaByStatus(cards)).toEqual({
      all: 3,
      confirmed: 2,
      in_progress: 0,
      completed: 0,
      cancelled: 1,
    })
    expect(sumProjectedRevenue(cards)).toBe(800)
  })
})

describe('availability + range helpers', () => {
  it('formats the active range from windows', () => {
    expect(
      formatActiveRangeLabel([
        { start_time: '17:00:00', end_time: '20:00:00' },
        { start_time: '09:00:00', end_time: '14:00:00' },
      ]),
    ).toBe('09:00 – 20:00')
    expect(formatActiveRangeLabel([])).toBe('Sin horario')
  })

  it('expands the query range to include the selected day', () => {
    const range = resolveBookingsQueryRange(
      new Date(2026, 10, 1),
      new Date(2026, 9, 16),
    )
    expect(range.fromDate).toBe('2026-10-16')
    expect(range.toDate).toBe('2026-11-30')
  })
})

describe('whatsappHref', () => {
  it('keeps only digits for wa.me', () => {
    expect(whatsappHref('+34 683 45 843')).toBe('https://wa.me/3468345843')
    expect(whatsappHref('123')).toBeNull()
  })
})
