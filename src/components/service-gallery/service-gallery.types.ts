export type ServiceGalleryProps = {
  open: boolean
  images: string[]
  initialIndex?: number
  serviceName: string
  onClose: () => void
}
