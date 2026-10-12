import type { EnterpriseDashboardSection } from '@src/lib/enterprise-dashboard-paths'
import type { IconProps } from '@components/icons/icons.types'
import type { ComponentType } from 'react'

export type EnterpriseDashboardNavItem = {
  section: EnterpriseDashboardSection
  label: string
  Icon: ComponentType<IconProps>
}

export type EnterpriseDashboardNavProps = {
  tenantSlug: string
}
