import type { AvailabilityWindow } from './time-slots.utils'

export type TimeSlotsProps = {
  date: Date | null
  value?: string | null
  onChange?: (startTime: string | null) => void
  windows: AvailabilityWindow[]
  durationMinutes: number
  eyebrow?: string
  title?: string
}
