import { supabase } from './supabase-client'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

export type TenantServiceRow = Tables<'services'>

export type CreateTenantServiceInput = {
  tenantId: string
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  active?: boolean
  imageUrl?: string | null
  imageUrls?: string[]
  youtubeUrl?: string | null
}

export type UpdateTenantServiceInput = {
  id: string
  name?: string
  price?: number
  durationMinutes?: number
  description?: string | null
  active?: boolean
  imageUrl?: string | null
  imageUrls?: string[]
  youtubeUrl?: string | null
}

export async function listTenantServices(
  tenantId: string,
): Promise<TenantServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createTenantService(
  input: CreateTenantServiceInput,
): Promise<TenantServiceRow> {
  const payload: TablesInsert<'services'> = {
    tenant_id: input.tenantId,
    name: input.name.trim(),
    price: input.price,
    duration_minutes: input.durationMinutes,
    description: input.description?.trim() || null,
    active: input.active ?? true,
  }

  const { data, error } = await supabase
    .from('services')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateTenantService(
  input: UpdateTenantServiceInput,
): Promise<TenantServiceRow> {
  const payload: TablesUpdate<'services'> = {}

  if (input.name !== undefined) {
    payload.name = input.name.trim()
  }
  if (input.price !== undefined) {
    payload.price = input.price
  }
  if (input.durationMinutes !== undefined) {
    payload.duration_minutes = input.durationMinutes
  }
  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null
  }
  if (input.active !== undefined) {
    payload.active = input.active
  }
  if (input.imageUrl !== undefined) {
    payload.image_url = input.imageUrl
  }
  if (input.imageUrls !== undefined) {
    payload.image_urls = input.imageUrls
  }
  if (input.youtubeUrl !== undefined) {
    payload.youtube_url = input.youtubeUrl
  }

  const { data, error } = await supabase
    .from('services')
    .update(payload)
    .eq('id', input.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteTenantService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)

  if (error) {
    throw error
  }
}
