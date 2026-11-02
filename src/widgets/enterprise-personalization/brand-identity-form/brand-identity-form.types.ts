import type { BrandingDraft } from '@src/lib/tenant-branding.utils'
import type { BrandLogoState } from '../enterprise-personalization.types'

export type BrandIdentityFormProps = {
  isPro: boolean
  logo: BrandLogoState
  draft: BrandingDraft
  websiteUrl: string
  isDirty: boolean
  isSaving: boolean
  errorMessage: string | null
  successMessage: string | null
  onLogoSelect: (file: File) => void
  onLogoRemove: () => void
  onDraftChange: (patch: Partial<BrandingDraft>) => void
  onWebsiteUrlChange: (value: string) => void
  onReset: () => void
  onSave: () => void
  onRequestUpgrade: () => void
}

export type ColorFieldProps = {
  id: string
  label: string
  value: string
  disabled: boolean
  onChange: (hex: string) => void
}
