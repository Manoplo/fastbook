import { describe, expect, it } from 'vitest'
import {
  clampGalleryIndex,
  clampGalleryZoom,
  nextGalleryIndex,
  prevGalleryIndex,
  resolveServiceGalleryUrls,
  zoomIn,
  zoomOut,
} from './service-gallery.utils'

describe('resolveServiceGalleryUrls', () => {
  it('prioriza image_urls no vacíos', () => {
    expect(
      resolveServiceGalleryUrls('https://legacy.jpg', [
        'https://a.webp',
        'https://b.webp',
      ]),
    ).toEqual(['https://a.webp', 'https://b.webp'])
  })

  it('filtra urls vacías de image_urls', () => {
    expect(
      resolveServiceGalleryUrls(null, ['https://a.webp', '', '  ', 'https://b.webp']),
    ).toEqual(['https://a.webp', 'https://b.webp'])
  })

  it('cae a image_url si la galería está vacía', () => {
    expect(resolveServiceGalleryUrls('https://cover.webp', [])).toEqual([
      'https://cover.webp',
    ])
    expect(resolveServiceGalleryUrls('https://cover.webp', null)).toEqual([
      'https://cover.webp',
    ])
  })

  it('devuelve vacío sin imágenes', () => {
    expect(resolveServiceGalleryUrls(null, null)).toEqual([])
    expect(resolveServiceGalleryUrls('', [])).toEqual([])
  })
})

describe('gallery index helpers', () => {
  it('clampa el índice', () => {
    expect(clampGalleryIndex(-1, 3)).toBe(0)
    expect(clampGalleryIndex(9, 3)).toBe(2)
    expect(clampGalleryIndex(1, 0)).toBe(0)
  })

  it('avanza y retrocede en bucle', () => {
    expect(nextGalleryIndex(2, 3)).toBe(0)
    expect(prevGalleryIndex(0, 3)).toBe(2)
    expect(nextGalleryIndex(0, 0)).toBe(0)
  })
})

describe('gallery zoom helpers', () => {
  it('hace zoom por pasos y clampa', () => {
    expect(zoomIn(1)).toBe(1.5)
    expect(zoomOut(1.5)).toBe(1)
    expect(zoomOut(1)).toBe(1)
    expect(clampGalleryZoom(10)).toBe(4)
    expect(clampGalleryZoom(0.2)).toBe(1)
  })
})
