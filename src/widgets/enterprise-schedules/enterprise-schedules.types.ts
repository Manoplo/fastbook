export type ScheduleSlotDraft = {
  localId: string
  startTime: string
  endTime: string
}

export type DayScheduleDraft = {
  dayOfWeek: number
  open: boolean
  slots: ScheduleSlotDraft[]
}

export type ServiceFormValues = {
  name: string
  durationMinutes: string
  price: string
  description: string
  active: boolean
}

export type UpgradeProReason = 'service_limit' | 'image_upload'
