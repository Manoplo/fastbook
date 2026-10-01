import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import {
  BUSINESS_NAME_META_KEY,
  BUSINESS_SLUG_META_KEY,
  readPendingBusinessProfile,
} from './ensure-owned-tenant'

function userWithMeta(meta: Record<string, unknown>): User {
  return {
    id: 'user-1',
    user_metadata: meta,
  } as User
}

describe('readPendingBusinessProfile', () => {
  it('lee name y slug válidos del metadata', () => {
    expect(
      readPendingBusinessProfile(
        userWithMeta({
          [BUSINESS_NAME_META_KEY]: ' Mi Salón ',
          [BUSINESS_SLUG_META_KEY]: 'Mi-Salon',
        }),
      ),
    ).toEqual({ name: 'Mi Salón', slug: 'mi-salon' })
  })

  it('devuelve null si faltan datos o el slug es inválido', () => {
    expect(readPendingBusinessProfile(null)).toBeNull()
    expect(
      readPendingBusinessProfile(
        userWithMeta({
          [BUSINESS_NAME_META_KEY]: 'Salón',
          [BUSINESS_SLUG_META_KEY]: 'enterprise',
        }),
      ),
    ).toBeNull()
    expect(
      readPendingBusinessProfile(
        userWithMeta({
          [BUSINESS_NAME_META_KEY]: '',
          [BUSINESS_SLUG_META_KEY]: 'ok-slug',
        }),
      ),
    ).toBeNull()
  })
})
