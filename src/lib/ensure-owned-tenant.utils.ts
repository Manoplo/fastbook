import type { User } from '@supabase/supabase-js'
import {
  isValidTenantSlug,
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
