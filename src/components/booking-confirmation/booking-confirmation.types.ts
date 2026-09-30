export type BookingConfirmationProps = {
  tenantName: string
  serviceName: string
  dateKey: string
  startTime: string
  customerEmail: string
  onNewBooking: () => void
}
