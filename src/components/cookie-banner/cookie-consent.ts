export type CookieConsent = 'accepted' | 'rejected'

const STORAGE_KEY = 'fastbook:cookie-consent'

export function readCookieConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'accepted' || value === 'rejected' ? value : null
  } catch {
    return null
  }
}

export function saveCookieConsent(consent: CookieConsent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, consent)
  } catch {
    // Sin almacenamiento disponible: el banner reaparecerá en la próxima visita.
  }
}
