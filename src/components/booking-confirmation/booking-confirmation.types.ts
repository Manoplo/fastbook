export type BookingConfirmationProps = {
  tenantName: string
  tenantSlug: string
  serviceName: string
  dateKey: string
  startTime: string
  customerEmail: string
  checkInToken: string
  onNewBooking: () => void
}
