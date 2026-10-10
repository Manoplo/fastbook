import { Link } from 'react-router-dom'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { CheckCircleIcon } from '@components/icons/check-circle-icon'
import { ENTERPRISE_LOGIN_PATH } from '@src/lib/enterprise-auth-paths'
import './enterprise-check-email.css'

export function EnterpriseCheckEmailPage() {
  return (
    <div className="enterprise-check-email">
      <section className="enterprise-check-email__panel">
        <div className="enterprise-check-email__inner">
          <Link to="/" className="enterprise-check-email__brand" aria-label="Inicio">
            <FastbookLogo />
          </Link>

          <div className="enterprise-check-email__icon-wrap" aria-hidden="true">
            <CheckCircleIcon className="enterprise-check-email__icon" />
          </div>

          <header className="enterprise-check-email__header">
            <h1 className="enterprise-check-email__title">¡Eres genial!</h1>
            <p className="enterprise-check-email__subtitle">
              Gracias por registrarte en Fastbook. Confirma tu email para empezar a
              gestionar tus citas.
            </p>
          </header>

          <p className="enterprise-check-email__hint" role="status">
            Te hemos enviado un mensaje con el enlace de confirmación. Revisa también la
            carpeta de spam.
          </p>

          <Link className="enterprise-check-email__login-link" to={ENTERPRISE_LOGIN_PATH}>
            ¿Ya confirmaste? Inicia sesión
          </Link>
        </div>
      </section>
    </div>
  )
}
