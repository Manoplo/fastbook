import type { PublicBookingRecord } from '@src/lib/public-booking-manage.utils'
import type { TenantWithServices } from '@src/lib/get-tenant-by-slug'

export type ManageBookingProps = {
  tenantSlug: string
  bookingId: string
}

export type ManageBookingContentProps = {
  booking: PublicBookingRecord
  tenant: TenantWithServices
  onBookingChange: (booking: PublicBookingRecord) => void
}
