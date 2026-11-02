import type { BookingWindowDraft } from '@src/lib/tenant-booking-window.utils'
import type { DayScheduleDraft } from '../enterprise-schedules.types'

export type WeeklyScheduleEditorProps = {
  days: DayScheduleDraft[]
  bookingWindow: BookingWindowDraft
  isSaving: boolean
  errorMessage: string | null
  onChange: (days: DayScheduleDraft[]) => void
  onBookingWindowChange: (patch: Partial<BookingWindowDraft>) => void
  onSave: () => void
  onCopyWeekdays: () => void
}
