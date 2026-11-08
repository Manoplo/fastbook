export type BookingConfirmationProps = {
  tenantName: string
  tenantSlug: string
  serviceName: string
  dateKey: string
  startTime: string
  customerEmail: string
  bookingId: string
  checkInToken: string
  onNewBooking: () => void
}
