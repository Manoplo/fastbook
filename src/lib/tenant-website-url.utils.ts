export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    if (!url.hostname.includes('.')) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

export function websiteLinkLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '')
    return hostname || 'Visitar web'
  } catch {
    return 'Visitar web'
  }
}

/** URL pública del negocio: solo tenants Pro con URL válida. */
export function resolvePublicWebsiteUrl(tenant: {
  is_pro: boolean
  website_url: string | null
}): string | null {
  if (!tenant.is_pro || !tenant.website_url) {
    return null
  }
  return normalizeWebsiteUrl(tenant.website_url)
}
