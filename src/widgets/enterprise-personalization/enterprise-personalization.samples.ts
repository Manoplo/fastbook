import type { TenantBrandingRow } from '@src/lib/tenant-branding'
import {
  DEFAULT_BRAND_FONT,
  DEFAULT_BRAND_ON_SURFACE,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  DEFAULT_BRAND_SURFACE,
  DEFAULT_LOGO_HEIGHT,
  type BrandingDraft,
} from '@src/lib/tenant-branding.utils'

/** Sample de branding para medir el skeleton de personalización. */
export const SAMPLE_BRANDING_ROW: TenantBrandingRow = {
  logo_url: null,
  brand_primary: DEFAULT_BRAND_PRIMARY,
  brand_secondary: DEFAULT_BRAND_SECONDARY,
  brand_surface: DEFAULT_BRAND_SURFACE,
  brand_on_surface: DEFAULT_BRAND_ON_SURFACE,
  brand_font: DEFAULT_BRAND_FONT,
  brand_logo_height: DEFAULT_LOGO_HEIGHT,
  website_url: 'https://estudiobelleza.example',
}

export const SAMPLE_BRANDING_DRAFT: BrandingDraft = {
  primary: DEFAULT_BRAND_PRIMARY,
  secondary: DEFAULT_BRAND_SECONDARY,
  surface: DEFAULT_BRAND_SURFACE,
  onSurface: DEFAULT_BRAND_ON_SURFACE,
  fontKey: DEFAULT_BRAND_FONT,
  logoHeight: DEFAULT_LOGO_HEIGHT,
}
