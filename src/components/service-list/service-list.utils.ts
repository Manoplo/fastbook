export function formatServicePrice(price: number): string {
  const value = Number(price)
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, '')
  return `${formatted}€`
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} min`
}

export function formatTagLabel(tag: string): string {
  if (!tag) {
    return tag
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}
