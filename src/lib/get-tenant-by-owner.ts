import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type OwnedTenant = Pick<
  Tables<'tenants'>,
  'id' | 'slug' | 'name' | 'booking_note' | 'owner_id' | 'is_pro'
>

export async function getTenantByOwner(
  ownerId: string,
): Promise<OwnedTenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, booking_note, owner_id, is_pro')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
