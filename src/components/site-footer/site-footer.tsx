import { LockIcon } from '../icons/lock-icon'
import { QrCodeIcon } from '../icons/qr-code-icon'
import { VerifiedIcon } from '../icons/verified-icon'
import './site-footer.css'

const TRUST_ITEMS = [
  {
    id: 'guaranteed',
    label: 'Reserva Garantizada',
    icon: VerifiedIcon,
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
                <Icon className="site-footer__badge-icon" />
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
