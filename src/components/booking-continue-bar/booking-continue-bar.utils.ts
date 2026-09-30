const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})

export function formatContinueBarDate(dateKey: string, startTime: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const formatted = DATE_FORMATTER.format(date)
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  return `${capitalized} · ${startTime} h`
}
