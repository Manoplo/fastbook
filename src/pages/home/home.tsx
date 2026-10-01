import { Link } from 'react-router-dom'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import './home.css'

export function HomePage() {
  return (
    <div className="home">
      <FastbookLogo />
      <h1 className="home__title">Da de alta tu negocio</h1>
      <p className="home__text">
        Crea tu cuenta de empresa o inicia sesión para acceder al panel. Tus
        clientes reservarán en tu página pública.
      </p>
      <div className="home__actions">
        <Link className="home__cta" to="/enterprise/login">
          Acceder / darse de alta
        </Link>
        <p className="home__hint">
          Ejemplo de reservas:{' '}
          <Link className="home__link" to="/demo-salon">
            /demo-salon
          </Link>
        </p>
      </div>
    </div>
  )
}
