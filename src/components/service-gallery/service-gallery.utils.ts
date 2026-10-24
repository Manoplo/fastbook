export const GALLERY_ZOOM_MIN = 1
export const GALLERY_ZOOM_MAX = 4
export const GALLERY_ZOOM_STEP = 0.5

/**
 * Resuelve la lista de URLs a mostrar en la galería pública.
 * Prioriza `image_urls`; si está vacía, cae a `image_url` (legacy/portada).
 */
export function resolveServiceGalleryUrls(
  imageUrl: string | null | undefined,
  imageUrls: string[] | null | undefined,
): string[] {
  const fromGallery = (imageUrls ?? []).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  )
  if (fromGallery.length > 0) {
    return fromGallery
  }
  if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
    return [imageUrl]
  }
  return []
}

export function clampGalleryIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  if (index < 0) {
    return 0
  }
  if (index >= length) {
    return length - 1
  }
  return index
}

export function nextGalleryIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  return (index + 1) % length
}

export function prevGalleryIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  return (index - 1 + length) % length
}

export function clampGalleryZoom(zoom: number): number {
  const stepped = Math.round(zoom / GALLERY_ZOOM_STEP) * GALLERY_ZOOM_STEP
  return Math.min(GALLERY_ZOOM_MAX, Math.max(GALLERY_ZOOM_MIN, stepped))
}

export function zoomIn(zoom: number): number {
  return clampGalleryZoom(zoom + GALLERY_ZOOM_STEP)
}

export function zoomOut(zoom: number): number {
  return clampGalleryZoom(zoom - GALLERY_ZOOM_STEP)
}
