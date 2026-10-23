export const SERVICE_IMAGES_BUCKET = 'service-images'

export type RemoteServiceImage = {
  kind: 'remote'
  id: string
  url: string
  storagePath: string
}

export type LocalServiceImage = {
  kind: 'local'
  id: string
  previewUrl: string
  blob: Blob
  fileName: string
  mimeType: string
  originalSize: number
  compressedSize: number
  usedWebp: boolean
}

export type ServiceImageItem = RemoteServiceImage | LocalServiceImage

export type ServiceGalleryDraft = {
  items: ServiceImageItem[]
  youtubeUrl: string
}

export function buildServiceImageStoragePath(options: {
  tenantId: string
  serviceId: string
  fileName: string
}): string {
  return `${options.tenantId}/${options.serviceId}/${options.fileName}`
}

/**
 * Extrae el path del objeto dentro del bucket desde una URL pública de Storage.
 * Formato típico: …/storage/v1/object/public/service-images/{path}
 */
export function storagePathFromPublicUrl(
  publicUrl: string,
  bucket: string = SERVICE_IMAGES_BUCKET,
): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = url.pathname.indexOf(marker)
    if (index === -1) {
      return null
    }
    const path = decodeURIComponent(url.pathname.slice(index + marker.length))
    return path || null
  } catch {
    return null
  }
}

export function coverImageUrlFromList(imageUrls: string[]): string | null {
  return imageUrls[0] ?? null
}

export function normalizeYoutubeUrl(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function hydrateRemoteImagesFromUrls(imageUrls: string[]): RemoteServiceImage[] {
  return imageUrls
    .map((url, index) => {
      const storagePath = storagePathFromPublicUrl(url)
      if (!storagePath) {
        return null
      }
      return {
        kind: 'remote' as const,
        id: `remote-${index}-${storagePath}`,
        url,
        storagePath,
      }
    })
    .filter((item): item is RemoteServiceImage => item !== null)
}

export function collectPathsToDelete(
  initialRemotePaths: string[],
  currentItems: ServiceImageItem[],
): string[] {
  const kept = new Set(
    currentItems
      .filter((item): item is RemoteServiceImage => item.kind === 'remote')
      .map((item) => item.storagePath),
  )
  return initialRemotePaths.filter((path) => !kept.has(path))
}

export function previewSrcForItem(item: ServiceImageItem): string {
  return item.kind === 'remote' ? item.url : item.previewUrl
}

export function revokeLocalPreviewUrls(items: ServiceImageItem[]): void {
  for (const item of items) {
    if (item.kind === 'local') {
      URL.revokeObjectURL(item.previewUrl)
    }
  }
}
