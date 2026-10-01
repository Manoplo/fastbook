import { describe, expect, it } from 'vitest'
import {
  authErrorMessage,
  getPasswordStrength,
  isValidEmail,
  isValidPassword,
  isValidTenantSlug,
  mapAuthErrorMessage,
  normalizeTenantSlug,
  passwordStrengthLabel,
} from './tenant-auth.utils'

describe('tenant-auth.utils', () => {
  it('normaliza y valida slugs', () => {
    expect(normalizeTenantSlug('  Demo-Salon ')).toBe('demo-salon')
    expect(isValidTenantSlug('demo-salon')).toBe(true)
    expect(isValidTenantSlug('a')).toBe(false)
    expect(isValidTenantSlug('Demo')).toBe(false)
    expect(isValidTenantSlug('bad_slug')).toBe(false)
    expect(isValidTenantSlug('enterprise')).toBe(false)
    expect(isValidTenantSlug('login')).toBe(false)
  })

  it('valida email y contraseña fuerte', () => {
    expect(isValidEmail('gerencia@aura.com')).toBe(true)
    expect(isValidEmail('malo')).toBe(false)
    expect(isValidPassword('123456')).toBe(false)
    expect(isValidPassword('Abcdef1!')).toBe(true)
    expect(isValidPassword('abcdefgh')).toBe(false)
    expect(isValidPassword('ABCDEF1!')).toBe(false)
  })

  it('calcula la fortaleza de la contraseña', () => {
    expect(getPasswordStrength('')).toBe('empty')
    expect(getPasswordStrength('abc')).toBe('weak')
    expect(getPasswordStrength('Abcdefgh')).toBe('medium')
    expect(getPasswordStrength('Abcdef1!')).toBe('strong')
    expect(passwordStrengthLabel('weak')).toBe('Débil')
    expect(passwordStrengthLabel('strong')).toBe('Fuerte')
  })

  it('mapea mensajes de Auth/Postgres a códigos', () => {
    expect(mapAuthErrorMessage('Invalid login credentials')).toBe(
      'invalid_credentials',
    )
    expect(mapAuthErrorMessage('User already registered')).toBe('email_taken')
    expect(mapAuthErrorMessage('duplicate key value violates unique constraint "tenants_slug_key"')).toBe(
      'slug_taken',
    )
    expect(mapAuthErrorMessage('Email not confirmed')).toBe(
      'email_not_confirmed',
    )
    expect(mapAuthErrorMessage('something else')).toBe('unknown')
  })

  it('devuelve mensajes legibles por código', () => {
    expect(authErrorMessage('slug_taken')).toContain('slug')
    expect(authErrorMessage('invalid_credentials')).toContain('incorrectos')
  })
})
