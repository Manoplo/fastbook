import type { CalendarDay } from './calendar.types'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

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

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatMonthYear(month: Date): string {
  return `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`
}

export function formatSelectedLabel(date: Date): string {
  const weekday = WEEKDAY_LONG[date.getDay()]
  const monthShort = MONTH_NAMES[date.getMonth()].slice(0, 3)
  return `${weekday}, ${date.getDate()} ${monthShort}`
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/** Lunes = 0 … Domingo = 6 */
function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function buildMonthGrid(options: {
  viewMonth: Date
  selected: Date | null
  today: Date
  minDate: Date
  availableKeys: Set<string> | null
}): CalendarDay[] {
  const { viewMonth, selected, today, minDate, availableKeys } = options
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = mondayBasedWeekday(firstOfMonth)

  const cells: CalendarDay[] = []
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startOffset + 1
    const date = new Date(year, month, dayOffset)
    const isCurrentMonth = date.getMonth() === month
    const dayStart = startOfDay(date)
    const isPast = dayStart < startOfDay(minDate)
    const key = toDateKey(date)
    const isAvailable =
      isCurrentMonth && !isPast && (availableKeys === null || availableKeys.has(key))

    cells.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: isSameDay(date, today),
      isPast,
      isAvailable,
      isSelected: selected !== null && isSameDay(date, selected),
    })
  }

  return cells
}

export { WEEKDAY_LABELS }
