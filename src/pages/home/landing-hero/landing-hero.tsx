import { Link } from 'react-router-dom'
import { ArrowForwardIcon } from '@components/icons/arrow-forward-icon'
import { CheckIcon } from '@components/icons/check-icon'
import { QrCodeIcon } from '@components/icons/qr-code-icon'
import { LOGIN_PATH } from '../home.constants'
import { Reveal } from '../reveal/reveal'
import './landing-hero.css'

const TIME_SLOTS = ['10:00', '11:30', '16:00', '17:15']
const SELECTED_SLOT = '11:30'

export function LandingHero() {
  return (
    <section className="landing-hero landing-container">
      <Reveal className="landing-hero__copy">
        <span className="landing-hero__badge">Reservas online para tu negocio</span>
        <h1 className="landing-hero__title">
          Tu negocio, reservable en{' '}
          <span className="landing-hero__title-accent">un enlace.</span>
        </h1>
        <p className="landing-hero__text">
          Elige tu slug, añade tus servicios y comparte{' '}
          <strong className="landing-hero__slug">fastbook.es/tu-negocio</strong>. Tus clientes
          reservan solos y reciben su confirmación con QR.
        </p>
        <div className="landing-hero__actions">
          <Link className="landing-btn landing-btn--primary" to={LOGIN_PATH}>
            Crear mi página gratis
            <ArrowForwardIcon className="landing-btn__icon" />
          </Link>
          <a className="landing-btn landing-btn--outline" href="#precios">
            Ver precios
          </a>
        </div>
        <p className="landing-hero__hint">Sin tarjeta. Tu slug listo en segundos.</p>
      </Reveal>

      <Reveal className="landing-hero__visual" delay={150}>
        <div className="landing-hero__card" aria-hidden="true">
          <div className="landing-hero__url">
            fastbook.es/<span className="landing-hero__url-slug">mi-negocio</span>
          </div>
          <div>
            <p className="landing-hero__card-title">Elige tu servicio</p>
            <p className="landing-hero__card-step">Paso 1 de 3</p>
          </div>
          <div className="landing-hero__services">
            <div className="landing-hero__service landing-hero__service--selected">
              <div>
                <p className="landing-hero__service-name">Servicio principal</p>
                <p className="landing-hero__service-meta">45 min</p>
              </div>
              <span className="landing-hero__radio landing-hero__radio--on">
                <CheckIcon className="landing-hero__radio-icon" />
              </span>
            </div>
            <div className="landing-hero__service">
              <div>
                <p className="landing-hero__service-name">Segundo servicio</p>
                <p className="landing-hero__service-meta">30 min</p>
              </div>
              <span className="landing-hero__radio" />
            </div>
          </div>
          <div className="landing-hero__slots">
            {TIME_SLOTS.map((slot) => (
              <span
                key={slot}
                className={
                  slot === SELECTED_SLOT
                    ? 'landing-hero__slot landing-hero__slot--selected'
                    : 'landing-hero__slot'
                }
              >
                {slot}
              </span>
            ))}
          </div>
          <div className="landing-hero__confirmation">
            <QrCodeIcon className="landing-hero__qr" />
            <div>
              <p className="landing-hero__confirmation-title">Confirmación enviada</p>
              <p className="landing-hero__confirmation-text">Email con tu código QR</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
