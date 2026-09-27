import './site-footer.css'

function VerifiedUserIcon() {
  return (
    <svg className="site-footer__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="site-footer__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
      />
    </svg>
  )
}

function QrCodeIcon() {
  return (
    <svg className="site-footer__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13 2h-2v2h2v-2zm2-2h-6v6h2v-2h2v2h2v-6zm-4 0h-2v2h2v-2z"
      />
    </svg>
  )
}

const TRUST_ITEMS = [
  {
    id: 'guaranteed',
    label: 'Reserva Garantizada',
    icon: VerifiedUserIcon,
    tone: 'tertiary' as const,
  },
  {
    id: 'secure',
    label: 'Cifrado Seguro',
    icon: LockIcon,
    tone: 'primary' as const,
  },
  {
    id: 'qr',
    label: 'Acceso QR Instantáneo',
    icon: QrCodeIcon,
    tone: 'secondary' as const,
  },
] as const

const FOOTER_LINKS = [
  { id: 'privacy', label: 'Privacidad', href: '#' },
  { id: 'terms', label: 'Términos', href: '#' },
  { id: 'support', label: 'Soporte', href: '#' },
] as const

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__brand-row">
            <span className="site-footer__name">fastbook</span>
            <span className="site-footer__verified">Verificado</span>
          </div>
          <p className="site-footer__tagline">
            Plataforma ágil de reservas instantáneas con confirmación en tiempo
            real y máxima fiabilidad para citas exclusivas.
          </p>
        </div>

        <ul className="site-footer__trust">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <li
                key={item.id}
                className={`site-footer__trust-item site-footer__trust-item--${item.tone}`}
              >
                <Icon />
                <span>{item.label}</span>
              </li>
            )
          })}
        </ul>

        <nav className="site-footer__nav" aria-label="Enlaces legales">
          {FOOTER_LINKS.map((link) => (
            <a key={link.id} className="site-footer__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="site-footer__legal">
        © {year} fastbook Inc. Todos los derechos reservados.
      </div>
    </footer>
  )
}
