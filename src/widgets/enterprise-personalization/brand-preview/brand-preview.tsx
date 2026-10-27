import { useEffect } from 'react'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { CheckCircleIcon } from '@components/icons/check-circle-icon'
import { loadBrandFont } from '@src/lib/tenant-branding-fonts'
import { buildBrandingStyle } from '@src/lib/tenant-branding.utils'
import type { BrandPreviewProps } from './brand-preview.types'
import './brand-preview.css'

const SAMPLE_SLOTS = ['09:00', '09:30', '10:00', '10:30']

export function BrandPreview({ tenantName, logoSrc, draft }: BrandPreviewProps) {
  useEffect(() => {
    void loadBrandFont(draft.fontKey)
  }, [draft.fontKey])

  return (
    <aside className="brand-preview" aria-label="Vista previa de tu página de reservas">
      <header className="brand-preview__intro">
        <h2 className="brand-preview__title">Vista previa</h2>
        <p className="brand-preview__subtitle">Así verán tus clientes tu página de reservas.</p>
      </header>

      <div className="brand-preview__page" style={buildBrandingStyle(draft)}>
        <div className="brand-preview__header">
          {logoSrc ? (
            <img
              className="brand-preview__logo"
              src={logoSrc}
              alt={tenantName}
              style={{ height: `${draft.logoHeight}px` }}
            />
          ) : (
            <FastbookLogo className="brand-preview__fallback-logo" />
          )}
        </div>

        <div className="brand-preview__body">
          <h3 className="brand-preview__heading">Reserva tu cita en {tenantName}</h3>
          <p className="brand-preview__text">Elige día, hora y servicio para confirmar.</p>

          <ul className="brand-preview__slots" aria-label="Horas de ejemplo">
            {SAMPLE_SLOTS.map((slot, index) => (
              <li
                key={slot}
                className={
                  index === 1
                    ? 'brand-preview__slot brand-preview__slot--selected'
                    : 'brand-preview__slot'
                }
              >
                {slot}
              </li>
            ))}
          </ul>

          <div className="brand-preview__service">
            <div>
              <p className="brand-preview__service-name">Servicio de ejemplo</p>
              <p className="brand-preview__service-meta">30 min</p>
            </div>
            <span className="brand-preview__service-price">25,00 €</span>
          </div>

          <p className="brand-preview__accent">
            <CheckCircleIcon className="brand-preview__accent-icon" />
            Reserva garantizada
          </p>

          <button type="button" className="brand-preview__cta" tabIndex={-1}>
            Continuar
          </button>
        </div>
      </div>
    </aside>
  )
}
