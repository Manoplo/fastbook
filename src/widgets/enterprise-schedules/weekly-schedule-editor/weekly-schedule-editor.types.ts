import type { DayScheduleDraft } from '../enterprise-schedules.types'

export type WeeklyScheduleEditorProps = {
  days: DayScheduleDraft[]
  isSaving: boolean
  errorMessage: string | null
  onChange: (days: DayScheduleDraft[]) => void
  onSave: () => void
  onCopyWeekdays: () => void
}
