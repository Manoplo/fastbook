import { describe, expect, it } from 'vitest'
import {
  buildAvailableDates,
  buildSlotsForDay,
  minutesToTime,
  periodForStartMinutes,
  timeToMinutes,
} from './time-slots.utils'

const VANESA_WINDOWS = [
  { day_of_week: 1, start_time: '10:00:00', end_time: '14:00:00' },
  { day_of_week: 1, start_time: '16:00:00', end_time: '20:00:00' },
  { day_of_week: 6, start_time: '10:00:00', end_time: '14:00:00' },
]

describe('timeToMinutes / minutesToTime', () => {
  it('convierte HH:mm y HH:mm:ss', () => {
    expect(timeToMinutes('10:00')).toBe(600)
    expect(timeToMinutes('16:30:00')).toBe(990)
    expect(minutesToTime(600)).toBe('10:00')
    expect(minutesToTime(990)).toBe('16:30')
  })
})

describe('periodForStartMinutes', () => {
  it('parte mañana/tarde en las 14:00', () => {
    expect(periodForStartMinutes(13 * 60)).toBe('morning')
    expect(periodForStartMinutes(14 * 60)).toBe('afternoon')
  })
})

describe('buildSlotsForDay', () => {
  it('genera huecos de 60 min lun–vie (mañana + tarde)', () => {
    const slots = buildSlotsForDay({
      dayOfWeek: 1,
      windows: VANESA_WINDOWS,
      durationMinutes: 60,
    })

    expect(slots.map((slot) => slot.startTime)).toEqual([
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ])
    expect(slots.filter((slot) => slot.period === 'morning')).toHaveLength(4)
    expect(slots.filter((slot) => slot.period === 'afternoon')).toHaveLength(4)
  })

  it('solo mañana el sábado', () => {
    const slots = buildSlotsForDay({
      dayOfWeek: 6,
      windows: VANESA_WINDOWS,
      durationMinutes: 60,
    })

    expect(slots.map((slot) => slot.startTime)).toEqual([
      '10:00',
      '11:00',
      '12:00',
      '13:00',
    ])
  })

  it('domingo sin ventanas → vacío', () => {
    expect(
      buildSlotsForDay({
        dayOfWeek: 0,
        windows: VANESA_WINDOWS,
        durationMinutes: 60,
      }),
    ).toEqual([])
  })

  it('deduplica ventanas repetidas entre servicios', () => {
    const slots = buildSlotsForDay({
      dayOfWeek: 1,
      windows: [...VANESA_WINDOWS, ...VANESA_WINDOWS],
      durationMinutes: 60,
    })

    expect(slots).toHaveLength(8)
  })
})

describe('buildAvailableDates', () => {
  it('incluye solo días con ventanas abiertas', () => {
    const from = new Date(2026, 8, 28) // lunes 28 sep 2026
    const dates = buildAvailableDates({
      windows: VANESA_WINDOWS,
      from,
      daysAhead: 7,
    })

    expect(dates.map((date) => date.getDay())).toEqual([1, 6])
  })
})
