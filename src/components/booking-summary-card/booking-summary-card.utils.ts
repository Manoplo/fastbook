const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatSummaryDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const formatted = FULL_DATE_FORMATTER.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatSummaryTimeLabel(startTime: string): string {
  const [hoursRaw] = startTime.split(':')
  const hours = Number(hoursRaw)
  const period = hours < 14 ? 'Turno matinal' : 'Turno de tarde'
  return `${startTime} h (${period})`
}

export function formatSummaryPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}
