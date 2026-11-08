import { describe, expect, it } from 'vitest'
import {
  filterSlotsByOccupancy,
  isStartTimeOccupied,
  normalizeTimeHhMm,
  occupiedStartsForDate,
} from './occupied-booking-slots.utils'

describe('normalizeTimeHhMm', () => {
  it('recorta a HH:mm', () => {
    expect(normalizeTimeHhMm('10:00:00')).toBe('10:00')
    expect(normalizeTimeHhMm('16:30')).toBe('16:30')
  })
})

describe('occupiedStartsForDate', () => {
  it('filtra por fecha y normaliza hora', () => {
    expect(
      occupiedStartsForDate(
        [
          { booking_date: '2026-11-10', start_time: '10:00:00' },
          { booking_date: '2026-11-11', start_time: '11:00:00' },
          { booking_date: '2026-11-10', start_time: '16:00' },
        ],
        '2026-11-10',
      ),
    ).toEqual(['10:00', '16:00'])
  })
})

describe('isStartTimeOccupied', () => {
  it('detecta ocupación con HH:mm:ss', () => {
    expect(isStartTimeOccupied('10:00', ['10:00:00', '16:00'])).toBe(true)
    expect(isStartTimeOccupied('11:00', ['10:00:00', '16:00'])).toBe(false)
  })
})

describe('filterSlotsByOccupancy', () => {
  it('filtra starts ocupados', () => {
    const slots = [
      { startTime: '10:00', period: 'morning' as const },
      { startTime: '11:00', period: 'morning' as const },
      { startTime: '16:00', period: 'afternoon' as const },
    ]
    expect(filterSlotsByOccupancy(slots, ['10:00:00', '16:00'])).toEqual([
      { startTime: '11:00', period: 'morning' },
    ])
  })

  it('sin ocupados deja todos', () => {
    const slots = [{ startTime: '10:00', period: 'morning' as const }]
    expect(filterSlotsByOccupancy(slots, [])).toEqual(slots)
  })
})
