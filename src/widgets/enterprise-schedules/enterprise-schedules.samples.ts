import type { TenantAvailabilityRow } from '@src/lib/tenant-availability'
import type { TenantServiceRow } from '@src/lib/tenant-services'

const SAMPLE_TENANT_ID = '00000000-0000-4000-8000-000000000001'

/** Sample de franjas semanales para medir el skeleton de horarios. */
export const SAMPLE_SCHEDULE_AVAILABILITY: TenantAvailabilityRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000031',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '14:00:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000032',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 1,
    start_time: '16:00:00',
    end_time: '20:00:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000033',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 2,
    start_time: '09:00:00',
    end_time: '14:00:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000034',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 3,
    start_time: '09:00:00',
    end_time: '14:00:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000035',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 4,
    start_time: '09:00:00',
    end_time: '14:00:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000036',
    tenant_id: SAMPLE_TENANT_ID,
    day_of_week: 5,
    start_time: '09:00:00',
    end_time: '14:00:00',
  },
]

/** Sample de servicios para medir el skeleton del catálogo. */
export const SAMPLE_SCHEDULE_SERVICES: TenantServiceRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    tenant_id: SAMPLE_TENANT_ID,
    name: 'Corte y peinado',
    price: 28,
    description: 'Corte personalizado con acabado y asesoramiento.',
    image_url: null,
    image_urls: [],
    tags: ['cabello'],
    duration_minutes: 45,
    active: true,
    youtube_url: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    tenant_id: SAMPLE_TENANT_ID,
    name: 'Coloración completa',
    price: 65,
    description: 'Coloración profesional con productos de cuidado.',
    image_url: null,
    image_urls: [],
    tags: ['color'],
    duration_minutes: 90,
    active: true,
    youtube_url: null,
    created_at: '2026-01-01T00:00:00Z',
  },
]
