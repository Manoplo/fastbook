import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthSession } from "@src/hooks/use-auth-session";
import { ENTERPRISE_LOGIN_PATH } from "@src/lib/enterprise-auth-paths";
import "./require-auth.css";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <div className="require-auth-loading" role="status">
        Cargando sesión…
      </div>
    );
  }

  if (!session) {
    return <Navigate to={ENTERPRISE_LOGIN_PATH} replace />;
  }

  return children;
}
