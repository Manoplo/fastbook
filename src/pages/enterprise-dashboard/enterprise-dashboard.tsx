import { useEffect } from 'react'
import { Link, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from 'skullet/react'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { useAuthSession } from '@src/hooks/use-auth-session'
import { signOut } from '@src/lib/auth-session'
import { enterpriseDashboardPath } from '@src/lib/enterprise-dashboard-paths'
import { getTenantByOwner } from '@src/lib/get-tenant-by-owner'
import { SAMPLE_OWNED_TENANT } from './enterprise-dashboard.samples'
import { EnterpriseDashboardShell } from './enterprise-dashboard-shell'
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

  useEffect(() => {
    if (tenantQuery.data?.banned_at) {
      void signOut()
    }
  }, [tenantQuery.data?.banned_at])

  const isShellLoading = isSessionLoading || !userId || tenantQuery.isLoading

  if (!isShellLoading) {
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

    if (tenant.banned_at) {
      return (
        <div className="enterprise-dashboard enterprise-dashboard--error">
          <FastbookLogo />
          <p>Tu cuenta ha sido desactivada. Contacta con soporte.</p>
          <Link className="enterprise-dashboard__link" to="/enterprise/login">
            Volver al login
          </Link>
        </div>
      )
    }

    if (tenantSlug && tenant.slug !== tenantSlug) {
      return <Navigate to={enterpriseDashboardPath(tenant.slug)} replace />
    }
  }

  const tenant = isShellLoading ? SAMPLE_OWNED_TENANT : tenantQuery.data!

  async function handleSignOut() {
    await signOut()
    navigate('/enterprise/login', { replace: true })
  }

  const outletContext: EnterpriseDashboardOutletContext | null = isShellLoading
    ? null
    : {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          isPro: tenant.is_pro,
          bookingOpensOn: tenant.booking_opens_on,
          bookingClosesOn: tenant.booking_closes_on,
        },
      }

  return (
    <Skeleton id="enterprise-shell" loading={isShellLoading} label="Cargando panel">
      <EnterpriseDashboardShell
        tenant={tenant}
        onSignOut={
          isShellLoading
            ? undefined
            : () => {
                void handleSignOut()
              }
        }
      >
        {outletContext ? <Outlet context={outletContext} /> : null}
      </EnterpriseDashboardShell>
    </Skeleton>
  )
}
