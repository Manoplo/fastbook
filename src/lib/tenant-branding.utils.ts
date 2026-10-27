import type { CSSProperties } from 'react'

export const TENANT_BRANDING_BUCKET = 'tenant-branding'

export const DEFAULT_BRAND_PRIMARY = '#1c2ac8'
export const DEFAULT_BRAND_SECONDARY = '#006a61'
export const DEFAULT_BRAND_SURFACE = '#ffffff'
export const DEFAULT_BRAND_ON_SURFACE = '#0b1c30'

export const MIN_LOGO_HEIGHT = 24
export const MAX_LOGO_HEIGHT = 64
export const DEFAULT_LOGO_HEIGHT = 40

/** Claves admitidas por el check de BBDD `tenants_brand_font_check`. */
export const BRAND_FONT_OPTIONS = [
  { key: 'space-grotesk', label: 'Space Grotesk', family: "'Space Grotesk Variable', system-ui, sans-serif" },
  { key: 'inter', label: 'Inter', family: "'Inter Variable', system-ui, sans-serif" },
  { key: 'dm-sans', label: 'DM Sans', family: "'DM Sans Variable', system-ui, sans-serif" },
  { key: 'manrope', label: 'Manrope', family: "'Manrope Variable', system-ui, sans-serif" },
  { key: 'playfair-display', label: 'Playfair Display', family: "'Playfair Display Variable', Georgia, serif" },
  { key: 'lora', label: 'Lora', family: "'Lora Variable', Georgia, serif" },
] as const

export type BrandFontKey = (typeof BRAND_FONT_OPTIONS)[number]['key']

export const DEFAULT_BRAND_FONT: BrandFontKey = 'space-grotesk'

export type TenantBrandingFields = {
  logo_url: string | null
  brand_primary: string | null
  brand_secondary: string | null
  brand_surface: string | null
  brand_on_surface: string | null
  brand_font: string | null
  brand_logo_height: number | null
  is_pro: boolean
}

export type BrandingDraft = {
  primary: string
  secondary: string
  surface: string
  onSurface: string
  fontKey: BrandFontKey
  logoHeight: number
}

export function isBrandFontKey(value: string | null | undefined): value is BrandFontKey {
  return BRAND_FONT_OPTIONS.some((option) => option.key === value)
}

export function brandFontFamily(key: BrandFontKey): string {
  return BRAND_FONT_OPTIONS.find((option) => option.key === key)?.family ?? BRAND_FONT_OPTIONS[0].family
}

/** Acepta `#rgb`, `rgb`, `#rrggbb`, `rrggbb`. Devuelve `#rrggbb` en minúsculas o null. */
export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '').toLowerCase()
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
  }
  if (/^[0-9a-f]{6}$/.test(raw)) {
    return `#${raw}`
  }
  return null
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbToHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const unit = channel / 255
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** Ratio de contraste WCAG (1–21) entre dos colores `#rrggbb`. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  const [lighter, darker] = first >= second ? [first, second] : [second, first]
  return (lighter + 0.05) / (darker + 0.05)
}

/** Mezcla `base` con `other`; `weight` (0–1) es el peso de `base`. */
export function mixHex(base: string, other: string, weight: number): string {
  const [baseRgb, otherRgb] = [hexToRgb(base), hexToRgb(other)]
  return rgbToHex(
    baseRgb.map((channel, index) =>
      Math.round(channel * weight + otherRgb[index] * (1 - weight)),
    ) as [number, number, number],
  )
}

const ON_LIGHT = '#0b1c30'
const ON_DARK = '#ffffff'
const MIN_PAIR_CONTRAST = 4.5

export function isDarkHex(hex: string): boolean {
  return relativeLuminance(hex) < 0.4
}

/** Color de texto legible sobre `background`. */
export function pickOnColor(background: string): string {
  return contrastRatio(background, ON_DARK) >= contrastRatio(background, ON_LIGHT)
    ? ON_DARK
    : ON_LIGHT
}

export type BrandingWarning =
  | 'primary_low_contrast'
  | 'secondary_low_contrast'
  | 'surface_text_low_contrast'

/** El primario/secundario se usan también como color de texto sobre fondo claro. */
export function brandingWarnings(
  draft: Pick<BrandingDraft, 'primary' | 'secondary' | 'surface' | 'onSurface'>,
): BrandingWarning[] {
  const warnings: BrandingWarning[] = []
  if (contrastRatio(draft.primary, '#ffffff') < 3) {
    warnings.push('primary_low_contrast')
  }
  if (contrastRatio(draft.secondary, '#ffffff') < 3) {
    warnings.push('secondary_low_contrast')
  }
  if (contrastRatio(draft.onSurface, draft.surface) < MIN_PAIR_CONTRAST) {
    warnings.push('surface_text_low_contrast')
  }
  return warnings
}

export function brandingWarningMessage(warning: BrandingWarning): string {
  switch (warning) {
    case 'primary_low_contrast':
      return 'El color primario es muy claro: los textos y botones pueden leerse mal sobre fondo blanco.'
    case 'secondary_low_contrast':
      return 'El color secundario es muy claro: los textos de acento pueden leerse mal sobre fondo blanco.'
    case 'surface_text_low_contrast':
      return 'Tipografía y fondo de cajas tienen poco contraste. Prueba tipografía clara sobre fondos oscuros.'
  }
}

export function clampLogoHeight(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LOGO_HEIGHT
  }
  return Math.min(MAX_LOGO_HEIGHT, Math.max(MIN_LOGO_HEIGHT, Math.round(value)))
}

export function draftFromTenant(
  tenant: Pick<
    TenantBrandingFields,
    | 'brand_primary'
    | 'brand_secondary'
    | 'brand_surface'
    | 'brand_on_surface'
    | 'brand_font'
    | 'brand_logo_height'
  >,
): BrandingDraft {
  const surface = normalizeHex(tenant.brand_surface ?? '') ?? DEFAULT_BRAND_SURFACE
  const storedOnSurface = normalizeHex(tenant.brand_on_surface ?? '')

  return {
    primary: normalizeHex(tenant.brand_primary ?? '') ?? DEFAULT_BRAND_PRIMARY,
    secondary: normalizeHex(tenant.brand_secondary ?? '') ?? DEFAULT_BRAND_SECONDARY,
    surface,
    onSurface: storedOnSurface ?? (surface === DEFAULT_BRAND_SURFACE ? DEFAULT_BRAND_ON_SURFACE : pickOnColor(surface)),
    fontKey: isBrandFontKey(tenant.brand_font) ? tenant.brand_font : DEFAULT_BRAND_FONT,
    logoHeight: clampLogoHeight(tenant.brand_logo_height ?? DEFAULT_LOGO_HEIGHT),
  }
}

/** Los valores por defecto se guardan como null para que sigan a los de Fastbook. */
export function draftToRowValues(draft: BrandingDraft): {
  brand_primary: string | null
  brand_secondary: string | null
  brand_surface: string | null
  brand_on_surface: string | null
  brand_font: string | null
  brand_logo_height: number | null
} {
  return {
    brand_primary: draft.primary === DEFAULT_BRAND_PRIMARY ? null : draft.primary,
    brand_secondary: draft.secondary === DEFAULT_BRAND_SECONDARY ? null : draft.secondary,
    brand_surface: draft.surface === DEFAULT_BRAND_SURFACE ? null : draft.surface,
    brand_on_surface: draft.onSurface === DEFAULT_BRAND_ON_SURFACE ? null : draft.onSurface,
    brand_font: draft.fontKey === DEFAULT_BRAND_FONT ? null : draft.fontKey,
    brand_logo_height: draft.logoHeight === DEFAULT_LOGO_HEIGHT ? null : draft.logoHeight,
  }
}

export function isDefaultDraft(draft: BrandingDraft): boolean {
  const values = draftToRowValues(draft)
  return Object.values(values).every((value) => value === null)
}

/**
 * Variables CSS que sobrescriben los tokens `--fb-*` en el contenedor.
 * Incluye surfaces (cajas) y tipografía para que la página pública coincida con el preview.
 */
export function buildBrandingStyle(
  draft: Pick<BrandingDraft, 'primary' | 'secondary' | 'surface' | 'onSurface' | 'fontKey'>,
): CSSProperties {
  const darkSurface = isDarkHex(draft.surface)
  const tintTarget = darkSurface ? '#000000' : '#ffffff'
  const brandTint = darkSurface ? draft.primary : draft.primary

  const surfaceLow = mixHex(draft.surface, brandTint, darkSurface ? 0.88 : 0.94)
  const surfaceMid = mixHex(draft.surface, brandTint, darkSurface ? 0.78 : 0.86)
  const surfaceHigh = mixHex(draft.surface, brandTint, darkSurface ? 0.68 : 0.78)
  const background = mixHex(draft.surface, brandTint, darkSurface ? 0.92 : 0.97)

  const primaryFixed = darkSurface
    ? mixHex(draft.primary, draft.surface, 0.4)
    : mixHex(draft.primary, '#ffffff', 0.14)
  const primaryContainer = darkSurface
    ? mixHex(draft.primary, '#ffffff', 0.72)
    : mixHex(draft.primary, '#ffffff', 0.82)

  const onSurfaceVariant = mixHex(draft.onSurface, draft.surface, 0.62)
  const outline = mixHex(draft.onSurface, draft.surface, 0.45)
  const outlineVariant = mixHex(draft.onSurface, draft.surface, 0.22)

  const [red, green, blue] = hexToRgb(draft.primary)
  const family = brandFontFamily(draft.fontKey)

  return {
    '--fb-primary': draft.primary,
    '--fb-primary-container': primaryContainer,
    '--fb-primary-fixed': primaryFixed,
    '--fb-on-primary': pickOnColor(draft.primary),
    '--fb-secondary': draft.secondary,
    '--fb-on-surface': draft.onSurface,
    '--fb-on-surface-variant': onSurfaceVariant,
    '--fb-outline': outline,
    '--fb-outline-variant': outlineVariant,
    '--fb-surface': mixHex(draft.surface, tintTarget, darkSurface ? 0.96 : 0.98),
    '--fb-surface-container-lowest': draft.surface,
    '--fb-surface-container-low': surfaceLow,
    '--fb-surface-container': surfaceMid,
    '--fb-surface-container-high': surfaceHigh,
    '--fb-background': background,
    '--fb-shadow-sm': darkSurface
      ? '0 1px 2px rgba(0, 0, 0, 0.35)'
      : '0 1px 2px rgba(11, 28, 48, 0.04)',
    '--fb-shadow-md': `0 4px 12px rgba(${red}, ${green}, ${blue}, ${darkSurface ? 0.35 : 0.18})`,
    '--fb-font': family,
    fontFamily: family,
    color: draft.onSurface,
  } as CSSProperties
}

export type PublicBranding = {
  logoUrl: string | null
  logoHeight: number
  draft: BrandingDraft
  style: CSSProperties
}

/** Branding aplicable a la página pública. Solo para tenants Pro. */
export function resolvePublicBranding(tenant: TenantBrandingFields): PublicBranding | null {
  if (!tenant.is_pro) {
    return null
  }
  const draft = draftFromTenant(tenant)
  if (!tenant.logo_url && isDefaultDraft(draft)) {
    return null
  }
  return {
    logoUrl: tenant.logo_url,
    logoHeight: draft.logoHeight,
    draft,
    style: buildBrandingStyle(draft),
  }
}
