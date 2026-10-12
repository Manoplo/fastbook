import { describe, expect, it } from 'vitest'
import { addDays, formatAgendaDateLabel, startOfDay } from './enterprise-agenda.utils'

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
