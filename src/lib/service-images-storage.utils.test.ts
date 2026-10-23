import { describe, expect, it } from 'vitest'
import {
  SERVICE_IMAGES_BUCKET,
  buildServiceImageStoragePath,
  collectPathsToDelete,
  coverImageUrlFromList,
  hydrateRemoteImagesFromUrls,
  normalizeYoutubeUrl,
  storagePathFromPublicUrl,
  type ServiceImageItem,
} from './service-images-storage.utils'

describe('buildServiceImageStoragePath', () => {
  it('compone tenant/service/filename', () => {
    expect(
      buildServiceImageStoragePath({
        tenantId: 'tenant-1',
        serviceId: 'service-1',
        fileName: 'a.webp',
      }),
    ).toBe('tenant-1/service-1/a.webp')
  })
})

describe('storagePathFromPublicUrl', () => {
  it('extrae el path del bucket público', () => {
    const url = `https://xyz.supabase.co/storage/v1/object/public/${SERVICE_IMAGES_BUCKET}/t1/s1/file.webp`
    expect(storagePathFromPublicUrl(url)).toBe('t1/s1/file.webp')
  })

  it('devuelve null si la URL no es del bucket', () => {
    expect(storagePathFromPublicUrl('https://example.com/foto.jpg')).toBeNull()
  })
})

describe('coverImageUrlFromList', () => {
  it('usa la primera como portada', () => {
    expect(coverImageUrlFromList(['a', 'b'])).toBe('a')
    expect(coverImageUrlFromList([])).toBeNull()
  })
})

describe('normalizeYoutubeUrl', () => {
  it('trim y null si vacío', () => {
    expect(normalizeYoutubeUrl('  https://youtu.be/x  ')).toBe('https://youtu.be/x')
    expect(normalizeYoutubeUrl('   ')).toBeNull()
  })
})

describe('hydrateRemoteImagesFromUrls', () => {
  it('ignora URLs que no son del bucket', () => {
    const good = `https://xyz.supabase.co/storage/v1/object/public/${SERVICE_IMAGES_BUCKET}/t/s/a.webp`
    const items = hydrateRemoteImagesFromUrls([good, 'https://cdn.example/x.jpg'])
    expect(items).toHaveLength(1)
    expect(items[0]?.storagePath).toBe('t/s/a.webp')
    expect(items[0]?.kind).toBe('remote')
  })
})

describe('collectPathsToDelete', () => {
  it('marca remotos quitados de la lista actual', () => {
    const current: ServiceImageItem[] = [
      {
        kind: 'remote',
        id: 'r1',
        url: 'https://x/a',
        storagePath: 't/s/a.webp',
      },
    ]
    expect(collectPathsToDelete(['t/s/a.webp', 't/s/b.webp'], current)).toEqual([
      't/s/b.webp',
    ])
  })
})
