import { describe, expect, it } from 'vitest'
import {
  addMinutesToTime,
  formatCustomerPhone,
  toPostgresTime,
} from './create-booking'

describe('create-booking utils', () => {
  it('suma minutos a una hora HH:mm', () => {
    expect(addMinutesToTime('10:00', 45)).toBe('10:45:00')
    expect(addMinutesToTime('10:30', 60)).toBe('11:30:00')
  })

  it('normaliza la hora a formato Postgres', () => {
    expect(toPostgresTime('10:00')).toBe('10:00:00')
    expect(toPostgresTime('10:00:00')).toBe('10:00:00')
  })

  it('formatea el teléfono o lo omite si está vacío', () => {
    expect(formatCustomerPhone('+34', '612 345 678')).toBe('+34 612 345 678')
    expect(formatCustomerPhone('+34', '  ')).toBeNull()
  })
})
