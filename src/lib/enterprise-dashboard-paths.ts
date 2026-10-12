export const ENTERPRISE_DASHBOARD_SECTIONS = [
  'agenda',
  'schedules',
  'metrics',
  'settings',
] as const

export type EnterpriseDashboardSection = (typeof ENTERPRISE_DASHBOARD_SECTIONS)[number]

export function enterpriseDashboardPath(
  tenantSlug: string,
  section: EnterpriseDashboardSection = 'agenda',
): string {
  return `/enterprise/${tenantSlug}/${section}`
}

export function isEnterpriseDashboardSection(
  value: string | undefined,
): value is EnterpriseDashboardSection {
  return (
    value !== undefined &&
    (ENTERPRISE_DASHBOARD_SECTIONS as readonly string[]).includes(value)
  )
}
