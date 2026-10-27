import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BRAND_ON_SURFACE,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  DEFAULT_BRAND_SURFACE,
  DEFAULT_LOGO_HEIGHT,
  brandingWarnings,
  buildBrandingStyle,
  clampLogoHeight,
  contrastRatio,
  draftFromTenant,
  draftToRowValues,
  isDefaultDraft,
  mixHex,
  normalizeHex,
  pickOnColor,
  resolvePublicBranding,
  type TenantBrandingFields,
} from './tenant-branding.utils'

const FREE_TENANT: TenantBrandingFields = {
  logo_url: 'https://cdn.test/logo.webp',
  brand_primary: '#aa0000',
  brand_secondary: null,
  brand_surface: null,
  brand_on_surface: null,
  brand_font: 'lora',
  brand_logo_height: null,
  is_pro: false,
}

describe('normalizeHex', () => {
  it('normaliza formatos válidos', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('1C2AC8')).toBe('#1c2ac8')
    expect(normalizeHex(' #1c2ac8 ')).toBe('#1c2ac8')
  })

  it('rechaza valores inválidos', () => {
    expect(normalizeHex('')).toBeNull()
    expect(normalizeHex('#12')).toBeNull()
    expect(normalizeHex('#gggggg')).toBeNull()
  })
})

describe('contrastRatio / pickOnColor', () => {
  it('blanco sobre negro es 21', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })

  it('elige blanco sobre fondos oscuros y oscuro sobre claros', () => {
    expect(pickOnColor('#1c2ac8')).toBe('#ffffff')
    expect(pickOnColor('#ffe066')).toBe('#0b1c30')
    expect(pickOnColor('#0c2725')).toBe('#ffffff')
  })
})

describe('mixHex', () => {
  it('mezcla con el peso indicado', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixHex('#102030', '#ffffff', 1)).toBe('#102030')
  })
})

describe('brandingWarnings', () => {
  it('avisa de colores demasiado claros', () => {
    expect(
      brandingWarnings({
        primary: '#ffee99',
        secondary: '#006a61',
        surface: DEFAULT_BRAND_SURFACE,
        onSurface: DEFAULT_BRAND_ON_SURFACE,
      }),
    ).toEqual(['primary_low_contrast'])
    expect(
      brandingWarnings({
        primary: '#1c2ac8',
        secondary: '#006a61',
        surface: DEFAULT_BRAND_SURFACE,
        onSurface: DEFAULT_BRAND_ON_SURFACE,
      }),
    ).toEqual([])
  })

  it('avisa si tipografía y fondo no contrastan', () => {
    expect(
      brandingWarnings({
        primary: '#1c2ac8',
        secondary: '#006a61',
        surface: '#111111',
        onSurface: '#222222',
      }),
    ).toEqual(['surface_text_low_contrast'])
  })
})

describe('clampLogoHeight', () => {
  it('acota al rango permitido', () => {
    expect(clampLogoHeight(10)).toBe(24)
    expect(clampLogoHeight(100)).toBe(64)
    expect(clampLogoHeight(Number.NaN)).toBe(DEFAULT_LOGO_HEIGHT)
  })
})

describe('draftFromTenant / draftToRowValues', () => {
  it('usa los defaults cuando no hay valores', () => {
    const draft = draftFromTenant({
      brand_primary: null,
      brand_secondary: null,
      brand_surface: null,
      brand_on_surface: null,
      brand_font: null,
      brand_logo_height: null,
    })
    expect(draft.primary).toBe(DEFAULT_BRAND_PRIMARY)
    expect(draft.secondary).toBe(DEFAULT_BRAND_SECONDARY)
    expect(draft.surface).toBe(DEFAULT_BRAND_SURFACE)
    expect(draft.onSurface).toBe(DEFAULT_BRAND_ON_SURFACE)
    expect(isDefaultDraft(draft)).toBe(true)
  })

  it('elige tipografía clara si el fondo guardado es oscuro y no hay tipografía', () => {
    const draft = draftFromTenant({
      brand_primary: null,
      brand_secondary: null,
      brand_surface: '#0c2725',
      brand_on_surface: null,
      brand_font: null,
      brand_logo_height: null,
    })
    expect(draft.onSurface).toBe('#ffffff')
  })

  it('ignora fuentes desconocidas', () => {
    const draft = draftFromTenant({
      brand_primary: null,
      brand_secondary: null,
      brand_surface: null,
      brand_on_surface: null,
      brand_font: 'comic-sans',
      brand_logo_height: null,
    })
    expect(draft.fontKey).toBe('space-grotesk')
  })

  it('guarda null para los valores por defecto', () => {
    const values = draftToRowValues({
      primary: '#aa0000',
      secondary: DEFAULT_BRAND_SECONDARY,
      surface: DEFAULT_BRAND_SURFACE,
      onSurface: DEFAULT_BRAND_ON_SURFACE,
      fontKey: 'inter',
      logoHeight: DEFAULT_LOGO_HEIGHT,
    })
    expect(values).toEqual({
      brand_primary: '#aa0000',
      brand_secondary: null,
      brand_surface: null,
      brand_on_surface: null,
      brand_font: 'inter',
      brand_logo_height: null,
    })
  })
})

describe('buildBrandingStyle', () => {
  it('sobrescribe tokens de marca, cajas y tipografía', () => {
    const style = buildBrandingStyle({
      primary: '#aa0000',
      secondary: '#00aa00',
      surface: '#111111',
      onSurface: '#ffffff',
      fontKey: 'lora',
    }) as Record<string, string>
    expect(style['--fb-primary']).toBe('#aa0000')
    expect(style['--fb-secondary']).toBe('#00aa00')
    expect(style['--fb-surface-container-lowest']).toBe('#111111')
    expect(style['--fb-on-surface']).toBe('#ffffff')
    expect(style['--fb-on-primary']).toBe('#ffffff')
    expect(style['--fb-font']).toContain('Lora Variable')
    expect(style.fontFamily).toContain('Lora Variable')
  })

  it('elige texto oscuro sobre CTAs claros', () => {
    const style = buildBrandingStyle({
      primary: '#ffe066',
      secondary: '#006a61',
      surface: DEFAULT_BRAND_SURFACE,
      onSurface: DEFAULT_BRAND_ON_SURFACE,
      fontKey: 'inter',
    }) as Record<string, string>
    expect(style['--fb-on-primary']).toBe('#0b1c30')
  })
})

describe('resolvePublicBranding', () => {
  it('no aplica branding a tenants free', () => {
    expect(resolvePublicBranding(FREE_TENANT)).toBeNull()
  })

  it('no aplica nada si es Pro pero sin personalizar', () => {
    expect(
      resolvePublicBranding({
        ...FREE_TENANT,
        is_pro: true,
        logo_url: null,
        brand_primary: null,
        brand_font: null,
      }),
    ).toBeNull()
  })

  it('devuelve branding para Pro personalizado', () => {
    const branding = resolvePublicBranding({ ...FREE_TENANT, is_pro: true })
    expect(branding?.logoUrl).toBe('https://cdn.test/logo.webp')
    expect(branding?.draft.primary).toBe('#aa0000')
    expect(branding?.logoHeight).toBe(DEFAULT_LOGO_HEIGHT)
  })
})
