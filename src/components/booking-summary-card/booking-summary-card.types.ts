export type BookingSummaryCardProps = {
  serviceName: string
  durationMinutes: number
  dateKey: string
  startTime: string
  price: number
  imageUrl?: string | null
  canConfirm?: boolean
  isSubmitting?: boolean
  submitError?: string | null
  formId?: string
  onEdit: () => void
}
