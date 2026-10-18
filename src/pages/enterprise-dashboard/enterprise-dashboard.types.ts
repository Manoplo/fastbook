export type EnterpriseDashboardTenant = {
  id: string
  slug: string
  name: string
  isPro: boolean
}

export type EnterpriseDashboardOutletContext = {
  tenant: EnterpriseDashboardTenant
}
