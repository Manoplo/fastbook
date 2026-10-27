/** Marketing site (Astro). Override en local con VITE_MARKETING_ORIGIN. */
export const MARKETING_ORIGIN =
  import.meta.env.VITE_MARKETING_ORIGIN ?? 'https://fastbook.es'

/** Origen canónico de esta SPA en producción. */
export const APP_ORIGIN = import.meta.env.VITE_APP_ORIGIN ?? 'https://app.fastbook.es'
