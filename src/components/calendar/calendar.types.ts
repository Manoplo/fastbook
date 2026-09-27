export type CalendarDay = {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  isAvailable: boolean
  isSelected: boolean
}

export type CalendarProps = {
  value?: Date | null
  onChange?: (date: Date) => void
  /** Fechas con disponibilidad (sin hora). Si se omite, todos los días futuros del mes son disponibles. */
  availableDates?: Date[]
  minDate?: Date
  eyebrow?: string
  title?: string
}
