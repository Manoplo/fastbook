import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FastbookLogo } from "@components/fastbook-logo/fastbook-logo";
import { useAuthSession } from "@src/hooks/use-auth-session";
import { signOut } from "@src/lib/auth-session";
import { getTenantByOwner } from "@src/lib/get-tenant-by-owner";
import "./enterprise-dashboard.css";

export function EnterpriseDashboardPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const userId = session?.user?.id;

  const tenantQuery = useQuery({
    queryKey: ["owned-tenant", userId],
    queryFn: () => getTenantByOwner(userId!),
    enabled: Boolean(userId),
  });

  if (isSessionLoading) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--loading">
        <p>Cargando panel…</p>
      </div>
    );
  }

  // RequireAuth ya garantiza sesión; si aún no hay userId, esperar query/sesión.
  if (!userId) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--loading">
        <p>Cargando panel…</p>
      </div>
    );
  }

  if (tenantQuery.isLoading) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--loading">
        <p>Cargando panel…</p>
      </div>
    );
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
    );
  }

  const tenant = tenantQuery.data;
  if (!tenant) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--error">
        <FastbookLogo />
        <p>No hay un negocio asociado a esta cuenta.</p>
        <Link className="enterprise-dashboard__link" to="/enterprise/login">
          Volver al login
        </Link>
      </div>
    );
  }

  if (tenantSlug && tenant.slug !== tenantSlug) {
    return <Navigate to={`/enterprise/${tenant.slug}`} replace />;
  }

  async function handleSignOut() {
    await signOut();
    navigate("/enterprise/login", { replace: true });
  }

  return (
    <div className="enterprise-dashboard">
      <header className="enterprise-dashboard__header">
        <div className="enterprise-dashboard__brand">
          <FastbookLogo />
          <div>
            <p className="enterprise-dashboard__eyebrow">Panel empresa</p>
            <h1 className="enterprise-dashboard__title">{tenant.name}</h1>
          </div>
        </div>
        <div className="enterprise-dashboard__actions">
          <Link className="enterprise-dashboard__link" to={`/${tenant.slug}`}>
            Ver página pública
          </Link>
          <button
            type="button"
            className="enterprise-dashboard__logout"
            onClick={() => {
              void handleSignOut();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="enterprise-dashboard__main">
        <section className="enterprise-dashboard__empty">
          <h2 className="enterprise-dashboard__empty-title">Tu dashboard está listo</h2>
          <p className="enterprise-dashboard__empty-text">
            La agenda de citas y la gestión de servicios llegarán en la siguiente iteración. Mientras tanto ya puedes
            usar tu página pública de reservas.
          </p>
          <p className="enterprise-dashboard__slug">
            Slug: <strong>/{tenant.slug}</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
