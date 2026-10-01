import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase-client'
import { getTenantByOwner, type OwnedTenant } from './get-tenant-by-owner'
import {
  TenantAuthError,
  isValidTenantSlug,
  mapAuthErrorMessage,
  normalizeTenantSlug,
} from './tenant-auth.utils'
import {
  readPendingBusinessProfile,
  type PendingBusinessProfile,
} from './ensure-owned-tenant.utils'

export {
  BUSINESS_NAME_META_KEY,
  BUSINESS_SLUG_META_KEY,
  readPendingBusinessProfile,
  type PendingBusinessProfile,
} from './ensure-owned-tenant.utils'

export async function createOwnedTenant(input: {
  ownerId: string
  name: string
  slug: string
}): Promise<OwnedTenant> {
  const name = input.name.trim()
  const slug = normalizeTenantSlug(input.slug)

  if (!name) {
    throw new TenantAuthError('validation', 'Indica el nombre del negocio.')
  }

  if (!isValidTenantSlug(slug)) {
    throw new TenantAuthError(
      'validation',
      'El slug solo puede tener minúsculas, números y guiones (2–48 caracteres).',
    )
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      owner_id: input.ownerId,
    })
    .select('id, slug, name, booking_note, owner_id')
    .single()

  if (error) {
    throw new TenantAuthError(mapAuthErrorMessage(error.message))
  }

  return tenant
}

/**
 * Devuelve el tenant del owner o lo crea desde el perfil pendiente / datos
 * explícitos. Si no hay forma de crearlo, lanza needs_business_setup.
 */
export async function ensureOwnedTenant(input: {
  user: User
  profile?: PendingBusinessProfile | null
}): Promise<OwnedTenant> {
  const existing = await getTenantByOwner(input.user.id)
  if (existing) {
    return existing
  }

  const profile = input.profile ?? readPendingBusinessProfile(input.user)
  if (!profile) {
    throw new TenantAuthError('needs_business_setup')
  }

  return createOwnedTenant({
    ownerId: input.user.id,
    name: profile.name,
    slug: profile.slug,
  })
}
