import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase-client'
import { getTenantByOwner, type OwnedTenant } from './get-tenant-by-owner'
import {
  TenantAuthError,
  isValidTenantSlug,
  mapAuthErrorMessage,
  normalizeTenantSlug,
} from './tenant-auth.utils'

export const BUSINESS_NAME_META_KEY = 'business_name'
export const BUSINESS_SLUG_META_KEY = 'business_slug'

export type PendingBusinessProfile = {
  name: string
  slug: string
}

export function readPendingBusinessProfile(
  user: User | null | undefined,
): PendingBusinessProfile | null {
  const meta = user?.user_metadata
  if (!meta || typeof meta !== 'object') {
    return null
  }

  const name =
    typeof meta[BUSINESS_NAME_META_KEY] === 'string'
      ? meta[BUSINESS_NAME_META_KEY].trim()
      : ''
  const slugRaw =
    typeof meta[BUSINESS_SLUG_META_KEY] === 'string'
      ? meta[BUSINESS_SLUG_META_KEY]
      : ''
  const slug = normalizeTenantSlug(slugRaw)

  if (!name || !isValidTenantSlug(slug)) {
    return null
  }

  return { name, slug }
}

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
