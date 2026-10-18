import classNames from 'classnames'
import { Modal } from '@components/modal/modal'
import type { ConfirmModalProps } from './confirm-modal.types'
import './confirm-modal.css'

export function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmingLabel,
  tone = 'default',
  isConfirming = false,
  titleId = 'confirm-modal-title',
}: ConfirmModalProps) {
  function handleClose() {
    if (!isConfirming) {
      onCancel()
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleClose}
      titleId={titleId}
      closeOnBackdrop={!isConfirming}
      footer={
        <>
          <button
            type="button"
            className="confirm-modal__cancel"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={classNames('confirm-modal__confirm', {
              'confirm-modal__confirm--danger': tone === 'danger',
            })}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (confirmingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-modal__description">{description}</p>
    </Modal>
  )
}
