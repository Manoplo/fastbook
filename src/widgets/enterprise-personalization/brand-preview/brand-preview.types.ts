import type { BrandingDraft } from '@src/lib/tenant-branding.utils'

export type BrandPreviewProps = {
  tenantName: string
  logoSrc: string | null
  draft: BrandingDraft
}
