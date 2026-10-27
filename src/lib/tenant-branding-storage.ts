import { supabase } from './supabase-client'
import { storagePathFromPublicUrl } from './service-images-storage.utils'
import { TENANT_BRANDING_BUCKET } from './tenant-branding.utils'

export function buildTenantLogoStoragePath(tenantId: string, extension: string): string {
  return `${tenantId}/logo-${crypto.randomUUID()}.${extension}`
}

/** Sube el logo ya convertido y devuelve su URL pública. */
export async function uploadTenantLogo(options: {
  tenantId: string
  blob: Blob
  mimeType: string
}): Promise<string> {
  const extension = options.mimeType === 'image/png' ? 'png' : 'webp'
  const storagePath = buildTenantLogoStoragePath(options.tenantId, extension)

  const { error } = await supabase.storage
    .from(TENANT_BRANDING_BUCKET)
    .upload(storagePath, options.blob, {
      contentType: options.mimeType,
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(TENANT_BRANDING_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** Best-effort: un logo huérfano en Storage no debe romper el guardado. */
export async function deleteTenantLogoByUrl(publicUrl: string | null): Promise<void> {
  if (!publicUrl) {
    return
  }
  const storagePath = storagePathFromPublicUrl(publicUrl, TENANT_BRANDING_BUCKET)
  if (!storagePath) {
    return
  }
  await supabase.storage.from(TENANT_BRANDING_BUCKET).remove([storagePath])
}
