import type { ReactNode } from 'react'

export type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** id del título para aria-labelledby; por defecto se genera uno estable. */
  titleId?: string
  className?: string
  /** Si false, el backdrop no cierra al hacer clic. */
  closeOnBackdrop?: boolean
}
