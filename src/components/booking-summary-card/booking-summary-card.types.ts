export type BookingSummaryCardProps = {
  serviceName: string
  durationMinutes: number
  dateKey: string
  startTime: string
  /** Null cuando la cita no está ligada a un servicio con precio. */
  price: number | null
  imageUrl?: string | null
  hasServices?: boolean
  canConfirm?: boolean
  isSubmitting?: boolean
  submitError?: string | null
  formId?: string
  onEdit: () => void
}
