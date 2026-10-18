export type ConfirmModalTone = 'default' | 'danger'

export type ConfirmModalProps = {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** Texto del botón primario mientras `isConfirming` es true. */
  confirmingLabel?: string
  tone?: ConfirmModalTone
  isConfirming?: boolean
  titleId?: string
}
