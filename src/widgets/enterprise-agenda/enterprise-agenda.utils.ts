import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  startOfDay,
  toDateKey,
} from '@components/calendar/calendar.utils'
import type { AgendaStatusFilterOption } from './enterprise-agenda.types'

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const WEEKDAY_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export { WEEKDAY_LABELS, addMonths, buildMonthGrid, formatMonthYear, startOfDay, toDateKey }

export function formatAgendaDateLabel(date: Date): string {
  const weekday = WEEKDAY_LONG[date.getDay()]
  const month = MONTH_NAMES[date.getMonth()]
  return `${weekday}, ${date.getDate()} de ${month} de ${date.getFullYear()}`
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const AGENDA_STATUS_FILTERS: AgendaStatusFilterOption[] = [
  { id: 'all', label: 'Todas las citas', tone: 'all' },
  { id: 'confirmed', label: 'Confirmadas', tone: 'confirmed' },
  { id: 'in_progress', label: 'En curso', tone: 'in-progress' },
  { id: 'completed', label: 'Completadas', tone: 'completed' },
  { id: 'cancelled', label: 'Canceladas', tone: 'cancelled' },
]
