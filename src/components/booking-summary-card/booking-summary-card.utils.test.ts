import { describe, expect, it } from 'vitest'
import {
  formatSummaryDate,
  formatSummaryPrice,
  formatSummaryTimeLabel,
} from './booking-summary-card.utils'

describe('booking-summary-card.utils', () => {
  it('formatea la fecha completa en español', () => {
    expect(formatSummaryDate('2024-10-24')).toMatch(/jueves/i)
    expect(formatSummaryDate('2024-10-24')).toContain('24')
    expect(formatSummaryDate('2024-10-24')).toMatch(/octubre/i)
  })

  it('etiqueta el turno según la hora', () => {
    expect(formatSummaryTimeLabel('10:00')).toBe('10:00 h (Turno matinal)')
    expect(formatSummaryTimeLabel('18:00')).toBe('18:00 h (Turno de tarde)')
  })

  it('formatea el precio en euros', () => {
    expect(formatSummaryPrice(45)).toMatch(/45/)
    expect(formatSummaryPrice(45)).toMatch(/€/)
  })
})
