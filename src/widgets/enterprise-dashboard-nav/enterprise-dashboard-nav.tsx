import { NavLink } from 'react-router-dom'
import classNames from 'classnames'
import { enterpriseDashboardPath } from '@src/lib/enterprise-dashboard-paths'
import type { EnterpriseDashboardNavProps } from './enterprise-dashboard-nav.types'
import { ENTERPRISE_DASHBOARD_NAV_ITEMS } from './enterprise-dashboard-nav.utils'
import './enterprise-dashboard-nav.css'

export function EnterpriseDashboardNav({ tenantSlug }: EnterpriseDashboardNavProps) {
  return (
    <footer className="enterprise-dashboard-nav">
      <nav className="enterprise-dashboard-nav__bar" aria-label="Navegación del panel">
        {ENTERPRISE_DASHBOARD_NAV_ITEMS.map(({ section, label, Icon }) => (
          <NavLink
            key={section}
            to={enterpriseDashboardPath(tenantSlug, section)}
            className={({ isActive }) =>
              classNames('enterprise-dashboard-nav__item', {
                'enterprise-dashboard-nav__item--active': isActive,
              })
            }
          >
            <Icon className="enterprise-dashboard-nav__icon" />
            <span className="enterprise-dashboard-nav__label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </footer>
  )
}
