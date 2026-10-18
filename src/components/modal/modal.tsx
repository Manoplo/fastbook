import { useEffect } from 'react'
import classNames from 'classnames'
import { CloseIcon } from '@components/icons/close-icon'
import type { ModalProps } from './modal.types'
import './modal.css'

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  titleId = 'fb-modal-title',
  className,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className={classNames('fb-modal', className)} role="presentation">
      <button
        type="button"
        className="fb-modal__backdrop"
        aria-label="Cerrar"
        onClick={() => {
          if (closeOnBackdrop) {
            onClose()
          }
        }}
      />
      <div
        className="fb-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="fb-modal__header">
          <h2 id={titleId} className="fb-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="fb-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon className="fb-modal__close-icon" />
          </button>
        </header>
        <div className="fb-modal__body">{children}</div>
        {footer ? <div className="fb-modal__footer">{footer}</div> : null}
      </div>
    </div>
  )
}
