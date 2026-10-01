import { supabase } from './supabase-client'
import {
  BUSINESS_NAME_META_KEY,
  BUSINESS_SLUG_META_KEY,
  ensureOwnedTenant,
} from './ensure-owned-tenant'
import type { OwnedTenant } from './get-tenant-by-owner'
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  TenantAuthError,
  isValidEmail,
  isValidPassword,
  isValidTenantSlug,
  mapAuthErrorMessage,
  normalizeTenantSlug,
} from './tenant-auth.utils'

export type SignUpTenantInput = {
  email: string
  password: string
  name: string
  slug: string
}

export type SignUpTenantResult =
  | { tenant: OwnedTenant; needsEmailConfirmation: false }
  | { tenant: null; needsEmailConfirmation: true }

export async function signUpTenant(
  input: SignUpTenantInput,
): Promise<SignUpTenantResult> {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const name = input.name.trim()
  const slug = normalizeTenantSlug(input.slug)

  if (!isValidEmail(email)) {
    throw new TenantAuthError('validation', 'Revisa el email.')
  }

  if (!isValidPassword(password)) {
    throw new TenantAuthError('validation', PASSWORD_REQUIREMENTS_MESSAGE)
  }

  if (!name) {
    throw new TenantAuthError('validation', 'Indica el nombre del negocio.')
  }

  if (!isValidTenantSlug(slug)) {
    throw new TenantAuthError(
      'validation',
      'El slug solo puede tener minúsculas, números y guiones (2–48 caracteres).',
    )
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        [BUSINESS_NAME_META_KEY]: name,
        [BUSINESS_SLUG_META_KEY]: slug,
      },
    },
  })

  if (authError) {
    throw new TenantAuthError(mapAuthErrorMessage(authError.message))
  }

  const user = authData.user
  if (!user) {
    throw new TenantAuthError('unknown')
  }

  // Sin sesión (confirm email activo): el tenant se crea en el primer login.
  if (!authData.session) {
    return { tenant: null, needsEmailConfirmation: true }
  }

  const tenant = await ensureOwnedTenant({
    user,
    profile: { name, slug },
  })

  return { tenant, needsEmailConfirmation: false }
}
