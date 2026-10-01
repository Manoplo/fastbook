import { supabase } from './supabase-client'
import { ensureOwnedTenant } from './ensure-owned-tenant'
import type { OwnedTenant } from './get-tenant-by-owner'
import {
  TenantAuthError,
  isValidEmail,
  mapAuthErrorMessage,
} from './tenant-auth.utils'

export type SignInTenantInput = {
  email: string
  password: string
}

export type SignInTenantResult = {
  tenant: OwnedTenant
}

export async function signInTenant(
  input: SignInTenantInput,
): Promise<SignInTenantResult> {
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!isValidEmail(email) || !password) {
    throw new TenantAuthError(
      'validation',
      'Revisa el email y la contraseña.',
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new TenantAuthError(mapAuthErrorMessage(error.message))
  }

  const user = data.user
  if (!user) {
    throw new TenantAuthError('unknown')
  }

  const tenant = await ensureOwnedTenant({ user })
  return { tenant }
}
