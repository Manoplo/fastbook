import { describe, expect, it } from 'vitest'
import {
  MAX_IMAGE_FILE_BYTES,
  MAX_SERVICE_IMAGES,
  computeScaledSize,
  isImageMimeType,
  rejectionMessage,
  takeFilesWithinLimit,
  validateImageFile,
} from './service-images-modal.utils'

function makeFile(name: string, size: number, type: string): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('isImageMimeType', () => {
  it('acepta raster y rechaza svg', () => {
    expect(isImageMimeType('image/jpeg')).toBe(true)
    expect(isImageMimeType('image/png')).toBe(true)
    expect(isImageMimeType('image/webp')).toBe(true)
    expect(isImageMimeType('image/svg+xml')).toBe(false)
    expect(isImageMimeType('application/pdf')).toBe(false)
  })
})

describe('validateImageFile', () => {
  it('rechaza no-imagen y archivos > 15 MB', () => {
    expect(validateImageFile(makeFile('a.pdf', 100, 'application/pdf'))).toEqual({
      ok: false,
      reason: 'not_image',
    })
    expect(
      validateImageFile(makeFile('big.jpg', MAX_IMAGE_FILE_BYTES + 1, 'image/jpeg')),
    ).toEqual({ ok: false, reason: 'too_large' })
    expect(validateImageFile(makeFile('ok.png', 1024, 'image/png'))).toEqual({ ok: true })
  })
})

describe('computeScaledSize', () => {
  it('no agranda imágenes pequeñas', () => {
    expect(computeScaledSize(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('limita el ancho máximo manteniendo proporción', () => {
    expect(computeScaledSize(3200, 1800, 1600)).toEqual({ width: 1600, height: 900 })
  })
})

describe('takeFilesWithinLimit', () => {
  it('recorta al cupo restante', () => {
    const files = [
      makeFile('1.jpg', 10, 'image/jpeg'),
      makeFile('2.jpg', 10, 'image/jpeg'),
      makeFile('3.jpg', 10, 'image/jpeg'),
    ]
    expect(takeFilesWithinLimit(MAX_SERVICE_IMAGES - 1, files)).toEqual({
      accepted: [files[0]],
      rejectedForLimit: 2,
    })
    expect(takeFilesWithinLimit(MAX_SERVICE_IMAGES, files).accepted).toHaveLength(0)
  })
})

describe('rejectionMessage', () => {
  it('incluye el límite de tamaño y de cantidad', () => {
    expect(rejectionMessage('too_large')).toContain('15')
    expect(rejectionMessage('limit_reached')).toContain(String(MAX_SERVICE_IMAGES))
  })
})
