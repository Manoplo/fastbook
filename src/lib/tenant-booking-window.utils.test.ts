import { describe, expect, it } from 'vitest'
import {
  bookingWindowToRowValues,
  inclusiveDayCount,
  parseDateOnly,
  resolveBookingRange,
  validateBookingWindowDraft,
} from './tenant-booking-window.utils'

describe('validateBookingWindowDraft', () => {
  it('acepta ventana vacía o con un solo extremo', () => {
    expect(validateBookingWindowDraft({ opensOn: '', closesOn: '' })).toBeNull()
    expect(validateBookingWindowDraft({ opensOn: '2026-11-10', closesOn: '' })).toBeNull()
    expect(validateBookingWindowDraft({ opensOn: '', closesOn: '2026-11-20' })).toBeNull()
  })

  it('rechaza max < min', () => {
    expect(
      validateBookingWindowDraft({ opensOn: '2026-11-20', closesOn: '2026-11-10' }),
    ).toMatch(/máxima/i)
  })
})

describe('bookingWindowToRowValues', () => {
  it('convierte vacíos a null', () => {
    expect(bookingWindowToRowValues({ opensOn: '  ', closesOn: '2026-12-01' })).toEqual({
      booking_opens_on: null,
      booking_closes_on: '2026-12-01',
    })
  })
})

describe('resolveBookingRange', () => {
  it('usa hoy si opensOn es pasado', () => {
    const today = new Date(2026, 10, 2)
    const range = resolveBookingRange({
      today,
      opensOn: '2026-10-01',
      closesOn: '2026-11-10',
    })
    expect(parseDateOnly('2026-11-02')?.getTime()).toBe(range.from.getTime())
    expect(range.maxDate?.getTime()).toBe(parseDateOnly('2026-11-10')?.getTime())
  })

  it('respeta opensOn futuro', () => {
    const today = new Date(2026, 10, 2)
    const range = resolveBookingRange({
      today,
      opensOn: '2026-11-15',
      closesOn: null,
      defaultDaysAhead: 5,
    })
    expect(range.from.getTime()).toBe(parseDateOnly('2026-11-15')?.getTime())
    expect(inclusiveDayCount(range.from, range.to)).toBe(5)
  })
})
