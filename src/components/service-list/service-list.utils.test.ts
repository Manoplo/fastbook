import { describe, expect, it } from 'vitest'
import {
  formatDurationMinutes,
  formatServicePrice,
  formatTagLabel,
} from './service-list.utils'

describe('formatServicePrice', () => {
  it('formatea enteros y decimales', () => {
    expect(formatServicePrice(100)).toBe('100€')
    expect(formatServicePrice(90.5)).toBe('90.5€')
    expect(formatServicePrice(100.0)).toBe('100€')
  })
})

describe('formatDurationMinutes', () => {
  it('añade unidad', () => {
    expect(formatDurationMinutes(60)).toBe('60 min')
  })
})

describe('formatTagLabel', () => {
  it('capitaliza la primera letra', () => {
    expect(formatTagLabel('navidad')).toBe('Navidad')
    expect(formatTagLabel('familia')).toBe('Familia')
  })
})
