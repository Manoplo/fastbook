import { describe, expect, it } from 'vitest'
import {
  MAX_LOGO_FILE_BYTES,
  computeContainedSize,
  logoRejectionMessage,
  validateLogoFile,
} from './enterprise-personalization.utils'

function makeFile(type: string, size = 100): File {
  const file = new File(['x'], 'logo', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateLogoFile', () => {
  it('acepta PNG, JPEG y SVG', () => {
    expect(validateLogoFile(makeFile('image/png')).ok).toBe(true)
    expect(validateLogoFile(makeFile('image/jpeg')).ok).toBe(true)
    expect(validateLogoFile(makeFile('image/svg+xml')).ok).toBe(true)
  })

  it('rechaza otros tipos y archivos grandes', () => {
    expect(validateLogoFile(makeFile('image/gif'))).toEqual({ ok: false, reason: 'invalid_type' })
    expect(validateLogoFile(makeFile('image/png', MAX_LOGO_FILE_BYTES + 1))).toEqual({
      ok: false,
      reason: 'too_large',
    })
  })
})

describe('logoRejectionMessage', () => {
  it('devuelve un mensaje por motivo', () => {
    expect(logoRejectionMessage('invalid_type')).toContain('PNG')
    expect(logoRejectionMessage('too_large')).toContain('5 MB')
  })
})

describe('computeContainedSize', () => {
  it('no amplía imágenes pequeñas por defecto', () => {
    expect(computeContainedSize(200, 100)).toEqual({ width: 200, height: 100 })
  })

  it('reduce manteniendo proporción', () => {
    expect(computeContainedSize(1024, 1024)).toEqual({ width: 256, height: 256 })
    expect(computeContainedSize(2048, 512)).toEqual({ width: 512, height: 128 })
  })

  it('amplía solo si se permite', () => {
    expect(computeContainedSize(100, 100, { allowUpscale: true })).toEqual({
      width: 256,
      height: 256,
    })
  })

  it('devuelve 0 con dimensiones inválidas', () => {
    expect(computeContainedSize(0, 10)).toEqual({ width: 0, height: 0 })
  })
})
