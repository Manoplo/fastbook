import { describe, expect, it } from 'vitest'
import {
  normalizeWebsiteUrl,
  resolvePublicWebsiteUrl,
  websiteLinkLabel,
} from './tenant-website-url.utils'

describe('normalizeWebsiteUrl', () => {
  it('añade https y valida hostname', () => {
    expect(normalizeWebsiteUrl('manoplo.com')).toBe('https://manoplo.com/')
    expect(normalizeWebsiteUrl('https://www.example.com/path')).toBe(
      'https://www.example.com/path',
    )
    expect(normalizeWebsiteUrl('')).toBeNull()
    expect(normalizeWebsiteUrl('not a url')).toBeNull()
  })
})

describe('websiteLinkLabel', () => {
  it('quita www del hostname', () => {
    expect(websiteLinkLabel('https://www.manoplo.com/bio')).toBe('manoplo.com')
  })
})

describe('resolvePublicWebsiteUrl', () => {
  it('solo Pro con URL', () => {
    expect(
      resolvePublicWebsiteUrl({ is_pro: false, website_url: 'https://a.com' }),
    ).toBeNull()
    expect(resolvePublicWebsiteUrl({ is_pro: true, website_url: null })).toBeNull()
    expect(
      resolvePublicWebsiteUrl({ is_pro: true, website_url: 'manoplo.com' }),
    ).toBe('https://manoplo.com/')
  })
})
