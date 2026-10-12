export type EnterpriseDashboardTenant = {
  id: string
  slug: string
  name: string
}

export type EnterpriseDashboardOutletContext = {
  tenant: EnterpriseDashboardTenant
}
