import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantAvailabilityWindow = Pick<
  Tables<'tenant_availability'>,
  'day_of_week' | 'start_time' | 'end_time'
>

export type TenantService = Pick<
  Tables<'services'>,
  | 'id'
  | 'name'
  | 'price'
  | 'description'
  | 'image_url'
  | 'image_urls'
  | 'tags'
  | 'duration_minutes'
  | 'active'
>

export type TenantWithServices = Pick<
  Tables<'tenants'>,
  'id' | 'slug' | 'name' | 'booking_note' | 'is_pro'
> & {
  services: TenantService[]
  tenant_availability: TenantAvailabilityWindow[]
}

export async function getTenantBySlug(
  slug: string,
): Promise<TenantWithServices | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select(
      `
      id,
      slug,
      name,
      booking_note,
      is_pro,
      tenant_availability (
        day_of_week,
        start_time,
        end_time
      ),
      services (
        id,
        name,
        price,
        description,
        image_url,
        image_urls,
        tags,
        duration_minutes,
        active
      )
    `,
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/** Ventanas semanales del tenant (horario de negocio). */
export function getTenantAvailabilityWindows(
  tenant: Pick<TenantWithServices, 'tenant_availability'>,
): TenantAvailabilityWindow[] {
  return tenant.tenant_availability
}

/** Duración de referencia para calcular huecos antes de elegir servicio. */
export function resolveSlotDurationMinutes(services: TenantService[]): number {
  if (services.length === 0) {
    return 60
  }
  return Math.max(...services.map((service) => service.duration_minutes))
}
