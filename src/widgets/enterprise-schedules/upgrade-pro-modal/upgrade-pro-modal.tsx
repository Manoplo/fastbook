import { Link } from 'react-router-dom'
import { Modal } from '@components/modal/modal'
import { FREE_MAX_SERVICES } from '../enterprise-schedules.utils'
import type { UpgradeProReason } from '../enterprise-schedules.types'
import type { UpgradeProModalProps } from './upgrade-pro-modal.types'
import './upgrade-pro-modal.css'

const UPGRADE_COPY: Record<UpgradeProReason, { title: string; body: string }> = {
  image_upload: {
    title: 'Imágenes disponibles en fastbook Pro',
    body: 'En el plan gratuito no se pueden subir imágenes a la ficha pública de tus servicios. Con Pro podrás incorporar galería en alta definición y más servicios activos.',
  },
  service_limit: {
    title: `Límite de ${FREE_MAX_SERVICES} servicios en el plan gratuito`,
    body: `Has alcanzado el límite de ${FREE_MAX_SERVICES} servicios activos del plan gratuito. Para añadir un tercero o incorporar galería de imágenes, actualiza a fastbook Pro.`,
  },
  branding: {
    title: 'Personalización disponible en fastbook Pro',
    body: 'Con Pro tu página de reservas luce tu marca: logotipo propio, colores corporativos y tipografía a tu medida.',
  },
}

export function UpgradeProModal({ open, reason, onClose }: UpgradeProModalProps) {
  const { title, body } = UPGRADE_COPY[reason]

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      titleId="upgrade-pro-modal-title"
      className="upgrade-pro-modal"
      footer={
        <>
          <button type="button" className="upgrade-pro-modal__secondary" onClick={onClose}>
            Seguir en gratuito
          </button>
          <Link to="/pricing" className="upgrade-pro-modal__primary" onClick={onClose}>
            Ver planes Pro
          </Link>
        </>
      }
    >
      <p className="upgrade-pro-modal__body">{body}</p>
    </Modal>
  )
}
