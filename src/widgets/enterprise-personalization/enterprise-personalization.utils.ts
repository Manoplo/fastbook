import {
  canvasToBlob,
  loadImageElement,
} from '@src/widgets/enterprise-schedules/service-images-modal/service-images-modal.utils'

export const LOGO_ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const
export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024
export const LOGO_MAX_WIDTH = 512
export const LOGO_MAX_HEIGHT = 256
export const LOGO_WEBP_QUALITY = 0.9
/** Tamaño de rasterizado para SVG sin dimensiones intrínsecas. */
const SVG_FALLBACK_SIZE = 512

export type LogoRejectionReason = 'invalid_type' | 'too_large'

export type LogoFileValidation =
  | { ok: true }
  | { ok: false; reason: LogoRejectionReason }

export type ConvertedLogo = {
  blob: Blob
  mimeType: string
  width: number
  height: number
}

export function validateLogoFile(file: File): LogoFileValidation {
  if (!(LOGO_ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'invalid_type' }
  }
  if (file.size > MAX_LOGO_FILE_BYTES) {
    return { ok: false, reason: 'too_large' }
  }
  return { ok: true }
}

export function logoRejectionMessage(reason: LogoRejectionReason): string {
  return reason === 'invalid_type'
    ? 'El logo debe ser un archivo PNG, JPEG o SVG.'
    : `El logo debe pesar como máximo ${MAX_LOGO_FILE_BYTES / (1024 * 1024)} MB.`
}

/** Escala para que quepa en la caja manteniendo proporción. Solo amplía si `allowUpscale`. */
export function computeContainedSize(
  width: number,
  height: number,
  options?: { maxWidth?: number; maxHeight?: number; allowUpscale?: boolean },
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 }
  }
  const maxWidth = options?.maxWidth ?? LOGO_MAX_WIDTH
  const maxHeight = options?.maxHeight ?? LOGO_MAX_HEIGHT
  const fit = Math.min(maxWidth / width, maxHeight / height)
  const scale = options?.allowUpscale ? fit : Math.min(1, fit)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Redimensiona el logo a una caja máxima y lo convierte a WebP conservando la transparencia.
 * El SVG se rasteriza vía `<img>` (los scripts del SVG no se ejecutan), así que no se sube SVG crudo.
 * Si el navegador no genera WebP, hace fallback a PNG (JPEG perdería el canal alfa).
 */
export async function convertLogoToWebp(file: File): Promise<ConvertedLogo> {
  const image = await loadImageElement(file)
  const naturalWidth = image.naturalWidth || SVG_FALLBACK_SIZE
  const naturalHeight = image.naturalHeight || SVG_FALLBACK_SIZE

  // Un SVG vectorial se puede ampliar hasta la caja máxima sin perder calidad.
  const { width, height } = computeContainedSize(naturalWidth, naturalHeight, {
    allowUpscale: file.type === 'image/svg+xml',
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo preparar el canvas para procesar el logo.')
  }
  context.drawImage(image, 0, 0, width, height)

  const webpBlob = await canvasToBlob(canvas, 'image/webp', LOGO_WEBP_QUALITY)
  if (webpBlob && webpBlob.type === 'image/webp') {
    return { blob: webpBlob, mimeType: 'image/webp', width, height }
  }

  const pngBlob = await canvasToBlob(canvas, 'image/png', 1)
  if (pngBlob) {
    return { blob: pngBlob, mimeType: 'image/png', width, height }
  }

  throw new Error('No se pudo convertir el logo.')
}
