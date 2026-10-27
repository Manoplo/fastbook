import { useEffect } from 'react'
import { MARKETING_ORIGIN } from '@src/lib/site-origins'

/** Redirige al marketing site (Astro en fastbook.es). */
export function MarketingRedirect() {
  useEffect(() => {
    window.location.replace(MARKETING_ORIGIN)
  }, [])

  return (
    <p style={{ margin: '2rem', textAlign: 'center' }}>
      Redirigiendo a{' '}
      <a href={MARKETING_ORIGIN}>{MARKETING_ORIGIN.replace(/^https?:\/\//, '')}</a>
      …
    </p>
  )
}
