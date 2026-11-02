export type EnterpriseDashboardTenant = {
  id: string
  slug: string
  name: string
  isPro: boolean
  bookingOpensOn: string | null
  bookingClosesOn: string | null
}

export type EnterpriseDashboardOutletContext = {
  tenant: EnterpriseDashboardTenant
}
