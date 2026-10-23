/** Límite de la UI de galería (modal). El check en BBDD admite hasta 10. */
export const MAX_SERVICE_IMAGES = 9

/** Evita bloquear la UI al decodificar/convertir. */
export const MAX_IMAGE_FILE_BYTES = 15 * 1024 * 1024

export const WEBP_MAX_WIDTH = 1600
export const WEBP_QUALITY = 0.8

export type ImageFileRejectionReason = 'not_image' | 'too_large' | 'limit_reached'

export type ImageFileValidation =
  | { ok: true }
  | { ok: false; reason: ImageFileRejectionReason }

export type ConvertImageResult = {
  blob: Blob
  mimeType: string
  usedWebp: boolean
  width: number
  height: number
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/') && mimeType !== 'image/svg+xml'
}

export function validateImageFile(file: File): ImageFileValidation {
  if (!isImageMimeType(file.type)) {
    return { ok: false, reason: 'not_image' }
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return { ok: false, reason: 'too_large' }
  }
  return { ok: true }
}

export function computeScaledSize(
  width: number,
  height: number,
  maxWidth: number = WEBP_MAX_WIDTH,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 }
  }
  if (width <= maxWidth) {
    return { width: Math.round(width), height: Math.round(height) }
  }
  const scale = maxWidth / width
  return {
    width: Math.round(maxWidth),
    height: Math.round(height * scale),
  }
}

export function takeFilesWithinLimit(
  existingCount: number,
  incoming: File[],
  maxCount: number = MAX_SERVICE_IMAGES,
): { accepted: File[]; rejectedForLimit: number } {
  const remaining = Math.max(0, maxCount - existingCount)
  if (remaining === 0) {
    return { accepted: [], rejectedForLimit: incoming.length }
  }
  return {
    accepted: incoming.slice(0, remaining),
    rejectedForLimit: Math.max(0, incoming.length - remaining),
  }
}

export function rejectionMessage(reason: ImageFileRejectionReason): string {
  switch (reason) {
    case 'not_image':
      return 'Solo se admiten archivos de imagen.'
    case 'too_large':
      return `Cada imagen debe pesar como máximo ${MAX_IMAGE_FILE_BYTES / (1024 * 1024)} MB.`
    case 'limit_reached':
      return `Puedes añadir como máximo ${MAX_SERVICE_IMAGES} imágenes.`
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

/**
 * Redimensiona (ancho máx.) y convierte a WebP vía canvas.
 * Si el navegador no produce `image/webp`, hace fallback a JPEG.
 */
export async function convertFileToWebp(
  file: File,
  options?: {
    maxWidth?: number
    quality?: number
  },
): Promise<ConvertImageResult> {
  const maxWidth = options?.maxWidth ?? WEBP_MAX_WIDTH
  const quality = options?.quality ?? WEBP_QUALITY

  const image = await loadImageElement(file)
  const { width, height } = computeScaledSize(image.naturalWidth, image.naturalHeight, maxWidth)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo preparar el canvas para comprimir la imagen.')
  }
  context.drawImage(image, 0, 0, width, height)

  const webpBlob = await canvasToBlob(canvas, 'image/webp', quality)
  if (webpBlob && webpBlob.type === 'image/webp') {
    return {
      blob: webpBlob,
      mimeType: 'image/webp',
      usedWebp: true,
      width,
      height,
    }
  }

  // Safari antiguo u otros: toBlob puede devolver PNG sin avisar.
  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
  if (jpegBlob) {
    return {
      blob: jpegBlob,
      mimeType: jpegBlob.type || 'image/jpeg',
      usedWebp: false,
      width,
      height,
    }
  }

  throw new Error('No se pudo convertir la imagen.')
}

export function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/webp') {
    return 'webp'
  }
  if (mimeType === 'image/jpeg') {
    return 'jpg'
  }
  if (mimeType === 'image/png') {
    return 'png'
  }
  return 'img'
}
