import type { BrandFontKey } from './tenant-branding.utils'

const FONT_LOADERS: Record<BrandFontKey, () => Promise<unknown>> = {
  'space-grotesk': () => import('@fontsource-variable/space-grotesk'),
  inter: () => import('@fontsource-variable/inter'),
  'dm-sans': () => import('@fontsource-variable/dm-sans'),
  manrope: () => import('@fontsource-variable/manrope'),
  'playfair-display': () => import('@fontsource-variable/playfair-display'),
  lora: () => import('@fontsource-variable/lora'),
}

/** Carga bajo demanda el CSS de la fuente (Vite genera un chunk por familia). */
export async function loadBrandFont(key: BrandFontKey): Promise<void> {
  try {
    await FONT_LOADERS[key]()
  } catch {
    // Sin la fuente se usa el fallback del stack; no bloquea la UI.
  }
}
