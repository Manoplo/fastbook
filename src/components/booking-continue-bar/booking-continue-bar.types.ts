export type BookingContinueBarProps = {
  serviceName: string
  durationMinutes: number
  dateKey: string
  startTime: string
  price: number
  onContinue: () => void
}
