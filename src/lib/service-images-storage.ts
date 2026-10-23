import { supabase } from './supabase-client'
import {
  SERVICE_IMAGES_BUCKET,
  buildServiceImageStoragePath,
  coverImageUrlFromList,
  normalizeYoutubeUrl,
  type LocalServiceImage,
  type ServiceImageItem,
} from './service-images-storage.utils'
import { updateTenantService, type TenantServiceRow } from './tenant-services'

export type SyncServiceGalleryInput = {
  tenantId: string
  serviceId: string
  items: ServiceImageItem[]
  /** Paths remotos presentes al abrir la modal (antes de editar). */
  initialRemotePaths: string[]
  youtubeUrl: string
}

export type SyncServiceGalleryResult = {
  service: TenantServiceRow
  imageUrls: string[]
}

function publicUrlForPath(storagePath: string): string {
  const { data } = supabase.storage.from(SERVICE_IMAGES_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function uploadLocalImage(options: {
  tenantId: string
  serviceId: string
  item: LocalServiceImage
}): Promise<string> {
  const uniqueName = `${crypto.randomUUID()}-${options.item.fileName}`
  const storagePath = buildServiceImageStoragePath({
    tenantId: options.tenantId,
    serviceId: options.serviceId,
    fileName: uniqueName,
  })

  const { error } = await supabase.storage
    .from(SERVICE_IMAGES_BUCKET)
    .upload(storagePath, options.item.blob, {
      contentType: options.item.mimeType,
      upsert: false,
    })

  if (error) {
    throw error
  }

  return publicUrlForPath(storagePath)
}

export async function deleteServiceImagePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(SERVICE_IMAGES_BUCKET).remove(paths)
  if (error) {
    throw error
  }
}

/** Best-effort: lista y borra todos los objetos bajo `{tenantId}/{serviceId}/`. */
export async function deleteAllServiceImages(options: {
  tenantId: string
  serviceId: string
}): Promise<void> {
  const folder = `${options.tenantId}/${options.serviceId}`
  const { data, error } = await supabase.storage.from(SERVICE_IMAGES_BUCKET).list(folder)

  if (error || !data || data.length === 0) {
    return
  }

  const paths = data
    .filter((entry) => Boolean(entry.name))
    .map((entry) => `${folder}/${entry.name}`)

  if (paths.length === 0) {
    return
  }

  await supabase.storage.from(SERVICE_IMAGES_BUCKET).remove(paths)
}

export async function syncServiceGallery(
  input: SyncServiceGalleryInput,
): Promise<SyncServiceGalleryResult> {
  const keptRemotePaths = new Set(
    input.items
      .filter((item): item is Extract<ServiceImageItem, { kind: 'remote' }> => item.kind === 'remote')
      .map((item) => item.storagePath),
  )
  const toDelete = input.initialRemotePaths.filter((path) => !keptRemotePaths.has(path))

  if (toDelete.length > 0) {
    await deleteServiceImagePaths(toDelete)
  }

  const imageUrls: string[] = []
  for (const item of input.items) {
    if (item.kind === 'remote') {
      imageUrls.push(item.url)
      continue
    }
    const uploadedUrl = await uploadLocalImage({
      tenantId: input.tenantId,
      serviceId: input.serviceId,
      item,
    })
    imageUrls.push(uploadedUrl)
  }

  const service = await updateTenantService({
    id: input.serviceId,
    imageUrls,
    imageUrl: coverImageUrlFromList(imageUrls),
    youtubeUrl: normalizeYoutubeUrl(input.youtubeUrl),
  })

  return { service, imageUrls }
}
