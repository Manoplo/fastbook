import { Link } from 'react-router-dom'
import { FastbookLogo } from '../../components/fastbook-logo/fastbook-logo'
import './home.css'

export function HomePage() {
  return (
    <div className="home">
      <FastbookLogo />
      <h1 className="home__title">Da de alta tu negocio</h1>
      <p className="home__text">
        El formulario de registro llegará en una próxima iteración. Mientras
        tanto, abre la ruta de reservas con el slug de tu tenant.
      </p>
      <p className="home__hint">
        Ejemplo:{' '}
        <Link className="home__link" to="/demo-salon">
          /demo-salon
        </Link>
      </p>
    </div>
  )
}
