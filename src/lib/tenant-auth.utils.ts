const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESERVED_SLUGS = new Set([
  'enterprise',
  'api',
  'admin',
  'www',
  'app',
  'login',
  'signup',
  'register',
  'dashboard',
])
const PASSWORD_MIN_LENGTH = 8

export function normalizeTenantSlug(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidTenantSlug(slug: string): boolean {
  return (
    slug.length >= 2 &&
    slug.length <= 48 &&
    SLUG_PATTERN.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  )
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

export type PasswordChecks = {
  minLength: boolean
  lowercase: boolean
  uppercase: boolean
  number: boolean
  special: boolean
}

export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong'

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return 'empty'
  }

  const checks = getPasswordChecks(password)
  const score = Object.values(checks).filter(Boolean).length

  if (score <= 2) {
    return 'weak'
  }
  if (score <= 4) {
    return 'medium'
  }
  return 'strong'
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Débil'
    case 'medium':
      return 'Media'
    case 'strong':
      return 'Fuerte'
    default:
      return ''
  }
}

/** Contraseña de alta: mayúsculas, minúsculas, número y carácter especial. */
export function isValidPassword(password: string): boolean {
  const checks = getPasswordChecks(password)
  return Object.values(checks).every(Boolean)
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, un número y un carácter especial.'

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'slug_taken'
  | 'email_not_confirmed'
  | 'no_tenant'
  | 'needs_business_setup'
  | 'unknown'

export function mapAuthErrorMessage(message: string | undefined): AuthErrorCode {
  const normalized = (message ?? '').toLowerCase()

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials')
  ) {
    return 'invalid_credentials'
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('email address is already registered')
  ) {
    return 'email_taken'
  }

  if (normalized.includes('email not confirmed')) {
    return 'email_not_confirmed'
  }

  if (
    normalized.includes('duplicate key') ||
    normalized.includes('tenants_slug') ||
    normalized.includes('unique constraint')
  ) {
    return 'slug_taken'
  }

  return 'unknown'
}

export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Email o contraseña incorrectos.'
    case 'email_taken':
      return 'Ya existe una cuenta con ese email.'
    case 'slug_taken':
      return 'Ese slug ya está en uso. Elige otro.'
    case 'email_not_confirmed':
      return 'Confirma tu email antes de iniciar sesión.'
    case 'no_tenant':
      return 'Tu cuenta no tiene un negocio asociado.'
    case 'needs_business_setup':
      return 'Completa los datos de tu negocio para continuar.'
    default:
      return 'No se pudo completar la operación. Inténtalo de nuevo.'
  }
}

export class TenantAuthError extends Error {
  code: AuthErrorCode | 'validation'

  constructor(code: AuthErrorCode | 'validation', message?: string) {
    super(
      message ??
        (code === 'validation'
          ? 'Revisa los datos del formulario.'
          : authErrorMessage(code)),
    )
    this.name = 'TenantAuthError'
    this.code = code
  }
}
