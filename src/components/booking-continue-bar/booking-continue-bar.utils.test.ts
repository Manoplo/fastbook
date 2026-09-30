import { describe, expect, it } from 'vitest'
import { formatContinueBarDate } from './booking-continue-bar.utils'

describe('formatContinueBarDate', () => {
  it('formatea fecha y hora en español', () => {
    expect(formatContinueBarDate('2024-10-24', '10:00')).toBe(
      'Jueves, 24 oct · 10:00 h',
    )
  })
})
