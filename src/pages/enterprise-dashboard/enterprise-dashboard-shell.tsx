import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { NotificationsIcon } from '@components/icons/notifications-icon'
import { PersonOutlineIcon } from '@components/icons/person-outline-icon'
import { enterpriseDashboardPath } from '@src/lib/enterprise-dashboard-paths'
import type { OwnedTenant } from '@src/lib/get-tenant-by-owner'
import { EnterpriseDashboardNav } from '@src/widgets/enterprise-dashboard-nav/enterprise-dashboard-nav'
import './enterprise-dashboard.css'

type EnterpriseDashboardShellProps = {
  tenant: Pick<OwnedTenant, 'slug' | 'name' | 'is_pro'>
  children?: ReactNode
  onSignOut?: () => void
}

/** Frame compartido del panel (header + main + nav) para contenido real y skeletons. */
export function EnterpriseDashboardShell({
  tenant,
  children,
  onSignOut,
}: EnterpriseDashboardShellProps) {
  return (
    <div className="enterprise-dashboard">
      <header className="enterprise-dashboard__header">
        <div className="enterprise-dashboard__brand">
          <Link
            to={enterpriseDashboardPath(tenant.slug)}
            className="enterprise-dashboard__logo-link"
            {...{ 'skullet-block': '' }}
          >
            <FastbookLogo className="enterprise-dashboard__logo" />
          </Link>
          <span className="enterprise-dashboard__plan-badge">
            {tenant.is_pro ? 'Pro Business' : 'Plan Gratuito'}
          </span>
        </div>

        <h1 className="enterprise-dashboard__tenant-name">{tenant.name}</h1>

        <div className="enterprise-dashboard__actions">
          <Link className="enterprise-dashboard__public-link" to={`/${tenant.slug}`}>
            Ver página pública
          </Link>
          <button
            type="button"
            className="enterprise-dashboard__icon-btn"
            aria-label="Notificaciones"
            disabled
            title="Próximamente"
          >
            <NotificationsIcon className="enterprise-dashboard__icon" />
          </button>
          <button
            type="button"
            className="enterprise-dashboard__avatar"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={onSignOut}
          >
            <PersonOutlineIcon className="enterprise-dashboard__icon" />
          </button>
        </div>
      </header>

      <main className="enterprise-dashboard__main">{children}</main>

      <EnterpriseDashboardNav tenantSlug={tenant.slug} />
    </div>
  )
}
