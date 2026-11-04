import type { OwnedTenant } from '@src/lib/get-tenant-by-owner'

/** Sample del tenant owner para medir el shell del dashboard. */
export const SAMPLE_OWNED_TENANT: OwnedTenant = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'negocio-ejemplo',
  name: 'Estudio Belleza Norte',
  booking_note: null,
  owner_id: '00000000-0000-4000-8000-000000000099',
  is_pro: false,
  banned_at: null,
  banned_reason: null,
  booking_opens_on: null,
  booking_closes_on: null,
}
