/** Rutas del flujo auth empresa (login, alta, post-signup). */
export const ENTERPRISE_LOGIN_PATH = '/enterprise/login'
export const ENTERPRISE_CHECK_EMAIL_PATH = '/enterprise/check-email'

/**
 * Destino del link de confirmación de email de Supabase Auth.
 * Debe estar permitido en Authentication → URL Configuration → Redirect URLs.
 */
export function getEmailConfirmRedirectTo(): string {
  return `${window.location.origin}${ENTERPRISE_LOGIN_PATH}`
}
