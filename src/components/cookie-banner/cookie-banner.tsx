import { useState } from 'react'
import { readCookieConsent, saveCookieConsent, type CookieConsent } from './cookie-consent'
import './cookie-banner.css'

export function CookieBanner() {
  const [visible, setVisible] = useState(() => readCookieConsent() === null)

  if (!visible) return null

  const handleChoice = (consent: CookieConsent) => {
    saveCookieConsent(consent)
    setVisible(false)
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Aviso de cookies">
      <p className="cookie-banner__text">
        <strong className="cookie-banner__title">Tu privacidad importa.</strong> Solo usamos
        lo imprescindible para que fastbook funcione. Si en el futuro añadimos cookies
        opcionales, te lo preguntaremos antes.
      </p>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--outline"
          onClick={() => handleChoice('rejected')}
        >
          Rechazar
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--primary"
          onClick={() => handleChoice('accepted')}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
