import type { AvailabilityWindow } from './time-slots.utils'

export type TimeSlotsProps = {
  date: Date | null
  value?: string | null
  onChange?: (startTime: string | null) => void
  windows: AvailabilityWindow[]
  durationMinutes: number
  /** Starts `HH:mm` / `HH:mm:ss` ya ocupados (confirmed); se ocultan. */
  occupiedStartTimes?: string[]
  eyebrow?: string
  title?: string
}
