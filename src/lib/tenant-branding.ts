import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantBrandingRow = Pick<
  Tables<'tenants'>,
  | 'logo_url'
  | 'brand_primary'
  | 'brand_secondary'
  | 'brand_surface'
  | 'brand_on_surface'
  | 'brand_font'
  | 'brand_logo_height'
>

const BRANDING_COLUMNS =
  'logo_url, brand_primary, brand_secondary, brand_surface, brand_on_surface, brand_font, brand_logo_height'

export async function getTenantBranding(tenantId: string): Promise<TenantBrandingRow> {
  const { data, error } = await supabase
    .from('tenants')
    .select(BRANDING_COLUMNS)
    .eq('id', tenantId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateTenantBranding(
  tenantId: string,
  patch: Partial<TenantBrandingRow>,
): Promise<TenantBrandingRow> {
  const { data, error } = await supabase
    .from('tenants')
    .update(patch)
    .eq('id', tenantId)
    .select(BRANDING_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return data
}
