export type BookingContinueBarProps = {
  serviceName: string
  durationMinutes: number
  dateKey: string
  startTime: string
  /** Null cuando la cita no está ligada a un servicio con precio. */
  price: number | null
  onContinue: () => void
}
