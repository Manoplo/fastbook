import { ENTERPRISE_LOGIN_PATH } from '@src/lib/enterprise-auth-paths'

export const LOGIN_PATH = ENTERPRISE_LOGIN_PATH

export const HOME_STEPS = [
  {
    title: 'Reserva tu slug',
    body: 'Elige fastbook.es/tu-negocio. Es instantáneo y es tu dirección propia.',
  },
  {
    title: 'Añade tus servicios',
    body: 'Nombre, duración y precio. Listo para que tus clientes elijan.',
  },
  {
    title: 'Comparte el enlace',
    body: 'Ponlo en Instagram, WhatsApp o tu web. Ellos reservan, tú atiendes.',
  },
] as const

export const FREE_FEATURES = [
  'Slug instantáneo',
  'Confirmación por email con QR',
  'Hasta 2 servicios',
] as const

export const PRO_FEATURES = [
  'Todo lo de Gratis',
  'Recordatorio por email al cliente, temprano el día de la cita',
  'Añade más servicios',
  'Imágenes y vídeo en tus servicios',
] as const

/** `true` = incluido, `false` = no incluido, `string` = texto libre. */
export type ComparisonValue = boolean | string

export type ComparisonRow = {
  label: string
  free: ComparisonValue
  pro: ComparisonValue
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Slug instantáneo', free: true, pro: true },
  { label: 'Confirmación por email con QR', free: true, pro: true },
  { label: 'Servicios', free: '2', pro: 'Más de 2' },
  { label: 'Recordatorio por email el día de la cita', free: false, pro: true },
  { label: 'Imágenes y vídeo en tus servicios', free: false, pro: true },
]
