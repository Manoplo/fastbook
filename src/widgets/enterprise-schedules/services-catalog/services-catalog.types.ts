import type { TenantServiceRow } from '@src/lib/tenant-services'
import type { ServiceFormValues } from '../enterprise-schedules.types'

export type ServicesCatalogProps = {
  services: TenantServiceRow[]
  isPro: boolean
  isSaving: boolean
  errorMessage: string | null
  editingServiceId: string | null
  formValues: ServiceFormValues
  onFormChange: (values: ServiceFormValues) => void
  onStartCreate: () => void
  onStartEdit: (service: TenantServiceRow) => void
  onCancelEdit: () => void
  onSubmit: () => void
  onDelete: (service: TenantServiceRow) => void
  onRequestUpgrade: (reason: 'service_limit' | 'image_upload') => void
}
