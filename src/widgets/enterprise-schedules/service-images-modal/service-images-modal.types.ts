import type { ServiceImageItem } from '@src/lib/service-images-storage.utils'

export type ServiceGallerySavePayload = {
  items: ServiceImageItem[]
  youtubeUrl: string
  /** Paths remotos al abrir (para calcular borrados). */
  initialRemotePaths: string[]
}

export type ServiceImagesModalProps = {
  open: boolean
  onClose: () => void
  /** Título contextual (nombre del servicio o “nuevo servicio”). */
  serviceLabel?: string
  /** Imágenes iniciales (remotas hidratadas y/o drafts locales pendientes). */
  initialItems?: ServiceImageItem[]
  initialYoutubeUrl?: string
  /** true mientras el padre sincroniza con Storage. */
  isSaving?: boolean
  /**
   * Persistencia. Si no hay serviceId en el padre, el padre solo guarda drafts.
   * Si hay serviceId, el padre hace sync a Storage.
   */
  onSave: (payload: ServiceGallerySavePayload) => void | Promise<void>
}
