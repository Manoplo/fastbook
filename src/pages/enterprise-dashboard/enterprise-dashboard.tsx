import { Link, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { NotificationsIcon } from '@components/icons/notifications-icon'
import { PersonOutlineIcon } from '@components/icons/person-outline-icon'
import { useAuthSession } from '@src/hooks/use-auth-session'
import { signOut } from '@src/lib/auth-session'
import { enterpriseDashboardPath } from '@src/lib/enterprise-dashboard-paths'
import { getTenantByOwner } from '@src/lib/get-tenant-by-owner'
import { EnterpriseDashboardNav } from '@src/widgets/enterprise-dashboard-nav/enterprise-dashboard-nav'
import type { EnterpriseDashboardOutletContext } from './enterprise-dashboard.types'
import './enterprise-dashboard.css'

export function EnterpriseDashboardPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>()
  const navigate = useNavigate()
  const { session, isLoading: isSessionLoading } = useAuthSession()
  const userId = session?.user?.id

  const tenantQuery = useQuery({
    queryKey: ['owned-tenant', userId],
    queryFn: () => getTenantByOwner(userId!),
    enabled: Boolean(userId),
  })

  if (isSessionLoading || !userId || tenantQuery.isLoading) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--loading">
        <p>Cargando panel…</p>
      </div>
    )
  }

  if (tenantQuery.isError) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--error">
        <FastbookLogo />
        <p>No se pudo cargar el negocio.</p>
        <Link className="enterprise-dashboard__link" to="/enterprise/login">
          Volver al login
        </Link>
      </div>
    )
  }

  const tenant = tenantQuery.data
  if (!tenant) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--error">
        <FastbookLogo />
        <p>No hay un negocio asociado a esta cuenta.</p>
        <Link className="enterprise-dashboard__link" to="/enterprise/login">
          Volver al login
        </Link>
      </div>
    )
  }

  if (tenantSlug && tenant.slug !== tenantSlug) {
    return <Navigate to={enterpriseDashboardPath(tenant.slug)} replace />
  }

  async function handleSignOut() {
    await signOut()
    navigate('/enterprise/login', { replace: true })
  }

  const outletContext: EnterpriseDashboardOutletContext = {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      isPro: tenant.is_pro,
    },
  }

  return (
    <div className="enterprise-dashboard">
      <header className="enterprise-dashboard__header">
        <div className="enterprise-dashboard__brand">
          <Link to={enterpriseDashboardPath(tenant.slug)} className="enterprise-dashboard__logo-link">
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
            onClick={() => {
              void handleSignOut()
            }}
          >
            <PersonOutlineIcon className="enterprise-dashboard__icon" />
          </button>
        </div>
      </header>

      <main className="enterprise-dashboard__main">
        <Outlet context={outletContext} />
      </main>

      <EnterpriseDashboardNav tenantSlug={tenant.slug} />
    </div>
  )
}
