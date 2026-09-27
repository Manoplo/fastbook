import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantServiceAvailability = Pick<
  Tables<'service_availability'>,
  'day_of_week' | 'start_time' | 'end_time'
>

export type TenantService = Pick<
  Tables<'services'>,
  | 'id'
  | 'name'
  | 'price'
  | 'description'
  | 'image_url'
  | 'tags'
  | 'duration_minutes'
  | 'active'
> & {
  service_availability: TenantServiceAvailability[]
}

export type TenantWithServices = Pick<
  Tables<'tenants'>,
  'id' | 'slug' | 'name' | 'booking_note'
> & {
  services: TenantService[]
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
      services (
        id,
        name,
        price,
        description,
        image_url,
        tags,
        duration_minutes,
        active,
        service_availability (
          day_of_week,
          start_time,
          end_time
        )
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

/** Ventanas de todos los servicios activos (pueden repetirse). */
export function collectAvailabilityWindows(
  services: TenantService[],
): TenantServiceAvailability[] {
  return services.flatMap((service) => service.service_availability)
}

/** Duración de referencia para calcular huecos antes de elegir servicio. */
export function resolveSlotDurationMinutes(services: TenantService[]): number {
  if (services.length === 0) {
    return 60
  }
  return Math.max(...services.map((service) => service.duration_minutes))
}
