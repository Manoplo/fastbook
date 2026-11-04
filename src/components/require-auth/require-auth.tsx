import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Skeleton } from 'skullet/react'
import { useAuthSession } from '@src/hooks/use-auth-session'
import { ENTERPRISE_LOGIN_PATH } from '@src/lib/enterprise-auth-paths'
import { SAMPLE_OWNED_TENANT } from '@src/pages/enterprise-dashboard/enterprise-dashboard.samples'
import { EnterpriseDashboardShell } from '@src/pages/enterprise-dashboard/enterprise-dashboard-shell'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { session, isLoading } = useAuthSession()

  if (isLoading) {
    return (
      <Skeleton id="enterprise-shell" loading label="Cargando sesión">
        <EnterpriseDashboardShell tenant={SAMPLE_OWNED_TENANT} />
      </Skeleton>
    )
  }

  if (!session) {
    return <Navigate to={ENTERPRISE_LOGIN_PATH} replace />
  }

  return children
}
