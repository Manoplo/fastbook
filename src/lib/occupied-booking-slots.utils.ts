export type OccupiedBookingStart = {
  booking_date: string
  start_time: string
}

/** Normaliza `HH:mm:ss` / `HH:mm` a `HH:mm`. */
export function normalizeTimeHhMm(time: string): string {
  return time.slice(0, 5)
}

export function occupiedStartsForDate(
  rows: OccupiedBookingStart[],
  dateKey: string,
): string[] {
  return rows
    .filter((row) => row.booking_date === dateKey)
    .map((row) => normalizeTimeHhMm(row.start_time))
}

export function occupiedStartTimeSet(occupiedStartTimes: string[]): Set<string> {
  return new Set(occupiedStartTimes.map(normalizeTimeHhMm))
}

export function isStartTimeOccupied(
  startTime: string,
  occupiedStartTimes: string[] | Set<string>,
): boolean {
  const occupied =
    occupiedStartTimes instanceof Set
      ? occupiedStartTimes
      : occupiedStartTimeSet(occupiedStartTimes)
  return occupied.has(normalizeTimeHhMm(startTime))
}

/** @deprecated Prefer disabled chips via isStartTimeOccupied; kept for tests. */
export function filterSlotsByOccupancy<T extends { startTime: string }>(
  slots: T[],
  occupiedStartTimes: string[],
): T[] {
  if (occupiedStartTimes.length === 0) {
    return slots
  }
  const occupied = occupiedStartTimeSet(occupiedStartTimes)
  return slots.filter((slot) => !occupied.has(normalizeTimeHhMm(slot.startTime)))
}
