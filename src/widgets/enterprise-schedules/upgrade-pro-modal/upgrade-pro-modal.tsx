import { Link } from 'react-router-dom'
import { CloseIcon } from '@components/icons/close-icon'
import { FREE_MAX_SERVICES } from '../enterprise-schedules.utils'
import type { UpgradeProModalProps } from './upgrade-pro-modal.types'
import './upgrade-pro-modal.css'

export function UpgradeProModal({ open, reason, onClose }: UpgradeProModalProps) {
  if (!open) {
    return null
  }

  const title =
    reason === 'image_upload'
      ? 'Imágenes disponibles en fastbook Pro'
      : `Límite de ${FREE_MAX_SERVICES} servicios en el plan gratuito`

  const body =
    reason === 'image_upload'
      ? 'En el plan gratuito no se pueden subir imágenes a la ficha pública de tus servicios. Con Pro podrás incorporar galería en alta definición y más servicios activos.'
      : `Has alcanzado el límite de ${FREE_MAX_SERVICES} servicios activos del plan gratuito. Para añadir un tercero o incorporar galería de imágenes, actualiza a fastbook Pro.`

  return (
    <div className="upgrade-pro-modal" role="presentation">
      <button
        type="button"
        className="upgrade-pro-modal__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="upgrade-pro-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-pro-modal-title"
      >
        <header className="upgrade-pro-modal__header">
          <h2 id="upgrade-pro-modal-title" className="upgrade-pro-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="upgrade-pro-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon className="upgrade-pro-modal__close-icon" />
          </button>
        </header>
        <p className="upgrade-pro-modal__body">{body}</p>
        <div className="upgrade-pro-modal__actions">
          <button type="button" className="upgrade-pro-modal__secondary" onClick={onClose}>
            Seguir en gratuito
          </button>
          <Link to="/pricing" className="upgrade-pro-modal__primary" onClick={onClose}>
            Ver planes Pro
          </Link>
        </div>
      </div>
    </div>
  )
}
