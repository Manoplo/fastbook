import { Link } from 'react-router-dom'
import { LOGIN_PATH } from '../home.constants'
import { Reveal } from '../reveal/reveal'
import './landing-final-cta.css'

export function LandingFinalCta() {
  return (
    <section className="landing-final-cta landing-container">
      <Reveal className="landing-final-cta__panel">
        <h2 className="landing-final-cta__title">
          Reserva tu slug antes de que lo coja otro
        </h2>
        <p className="landing-final-cta__text">
          <span className="landing-final-cta__slug">
            fastbook.es/<strong>tu-negocio</strong>
          </span>{' '}
          es tuyo en segundos.
        </p>
        <Link className="landing-btn landing-btn--light" to={LOGIN_PATH}>
          Acceso empresas
        </Link>
      </Reveal>
    </section>
  )
}
