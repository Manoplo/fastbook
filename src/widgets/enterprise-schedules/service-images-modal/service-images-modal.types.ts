export type ServiceImageDraft = {
  id: string
  previewUrl: string
  blob: Blob
  fileName: string
  mimeType: string
  originalSize: number
  compressedSize: number
  usedWebp: boolean
}

export type ServiceImagesModalProps = {
  open: boolean
  onClose: () => void
  /** Título contextual (nombre del servicio o “nuevo servicio”). */
  serviceLabel?: string
}
