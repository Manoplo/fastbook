import { useId, useRef, useState } from 'react'
import classNames from 'classnames'
import { CloseIcon } from '@components/icons/close-icon'
import { ImageIcon } from '@components/icons/image-icon'
import { Modal } from '@components/modal/modal'
import type { LocalServiceImage, ServiceImageItem } from '@src/lib/service-images-storage.utils'
import { previewSrcForItem } from '@src/lib/service-images-storage.utils'
import type { ServiceImagesModalProps } from './service-images-modal.types'
import {
  MAX_IMAGE_FILE_BYTES,
  MAX_SERVICE_IMAGES,
  convertFileToWebp,
  extensionForMime,
  rejectionMessage,
  takeFilesWithinLimit,
  validateImageFile,
} from './service-images-modal.utils'
import './service-images-modal.css'

let draftIdCounter = 0

function nextDraftId(): string {
  draftIdCounter += 1
  return `img-draft-${draftIdCounter}`
}

function remotePathsFromItems(items: ServiceImageItem[]): string[] {
  return items
    .filter((item): item is Extract<ServiceImageItem, { kind: 'remote' }> => item.kind === 'remote')
    .map((item) => item.storagePath)
}

function parentOwnedLocalIdsFromItems(items: ServiceImageItem[]): string[] {
  return items.filter((item) => item.kind === 'local').map((item) => item.id)
}

function revokeCancelLocals(
  items: ServiceImageItem[],
  parentOwnedLocalIds: ReadonlySet<string>,
): void {
  for (const item of items) {
    if (item.kind === 'local' && !parentOwnedLocalIds.has(item.id)) {
      URL.revokeObjectURL(item.previewUrl)
    }
  }
}

function thumbMetaLabel(image: ServiceImageItem, index: number): string {
  const parts: string[] = []
  if (index === 0) {
    parts.push('Portada')
  }
  if (image.kind === 'local') {
    parts.push(
      `${(image.compressedSize / 1024).toFixed(0)} KB${image.usedWebp ? '' : ' · JPEG'}`,
    )
  } else if (index !== 0) {
    parts.push('Guardada')
  }
  return parts.join(' · ')
}

/**
 * Debe montarse solo mientras la galería está abierta (el padre desmonta al cerrar).
 * Así el estado se inicializa limpio con initialItems / youtube sin sync en render.
 */
export function ServiceImagesModal({
  open,
  onClose,
  serviceLabel,
  initialItems = [],
  initialYoutubeUrl = '',
  isSaving = false,
  onSave,
}: ServiceImagesModalProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<ServiceImageItem[]>(() => [...initialItems])
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl)
  const [initialRemotePaths] = useState(() => remotePathsFromItems(initialItems))
  const [parentOwnedLocalIds] = useState(() => new Set(parentOwnedLocalIdsFromItems(initialItems)))

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    if (isSaving || isSubmitting) {
      return
    }
    revokeCancelLocals(items, parentOwnedLocalIds)
    onClose()
  }

  async function processFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (incoming.length === 0) {
      return
    }

    const { accepted, rejectedForLimit } = takeFilesWithinLimit(items.length, incoming)
    const messages: string[] = []

    if (rejectedForLimit > 0) {
      messages.push(rejectionMessage('limit_reached'))
    }

    const validFiles: File[] = []
    for (const file of accepted) {
      const validation = validateImageFile(file)
      if (!validation.ok) {
        messages.push(`${file.name}: ${rejectionMessage(validation.reason)}`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      setErrorMessage(messages[0] ?? null)
      return
    }

    setIsProcessing(true)
    setErrorMessage(messages[0] ?? null)

    const prepared: LocalServiceImage[] = []
    try {
      for (const file of validFiles) {
        const converted = await convertFileToWebp(file)
        const previewUrl = URL.createObjectURL(converted.blob)
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagen'
        prepared.push({
          kind: 'local',
          id: nextDraftId(),
          previewUrl,
          blob: converted.blob,
          fileName: `${baseName}.${extensionForMime(converted.mimeType)}`,
          mimeType: converted.mimeType,
          originalSize: file.size,
          compressedSize: converted.blob.size,
          usedWebp: converted.usedWebp,
        })
      }

      setItems((prev) => [...prev, ...prepared])
    } catch (error) {
      for (const draft of prepared) {
        URL.revokeObjectURL(draft.previewUrl)
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudieron procesar las imágenes.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function removeImage(id: string) {
    setItems((prev) => {
      const target = prev.find((image) => image.id === id)
      if (target?.kind === 'local') {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((image) => image.id !== id)
    })
    setErrorMessage(null)
  }

  async function handleSave() {
    if (isSaving || isSubmitting || isProcessing) {
      return
    }
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await onSave({
        items,
        youtubeUrl,
        initialRemotePaths,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo guardar la galería.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const slotsLeft = MAX_SERVICE_IMAGES - items.length
  const busy = isProcessing || isSaving || isSubmitting
  const title = serviceLabel ? `Galería · ${serviceLabel}` : 'Galería del servicio'

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleClose}
      titleId="service-images-modal-title"
      className="service-images-modal"
      closeOnBackdrop={!busy}
      footer={
        <>
          <button
            type="button"
            className="service-images-modal__secondary"
            onClick={handleClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="service-images-modal__primary"
            onClick={() => {
              void handleSave()
            }}
            disabled={busy}
          >
            {busy && !isProcessing ? 'Guardando…' : 'Guardar galería'}
          </button>
        </>
      }
    >
      <p className="service-images-modal__lead">
        Arrastra hasta {MAX_SERVICE_IMAGES} imágenes o selecciónalas desde tu dispositivo. La
        primera será la portada. Se convertirán a WebP antes de subirlas.
      </p>

      <div
        className={classNames('service-images-modal__dropzone', {
          'service-images-modal__dropzone--active': isDragging,
          'service-images-modal__dropzone--disabled': busy || slotsLeft === 0,
        })}
        onDragEnter={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (slotsLeft > 0 && !busy) {
            setIsDragging(true)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setIsDragging(false)
          if (busy || slotsLeft === 0) {
            return
          }
          void processFiles(event.dataTransfer.files)
        }}
        onClick={() => {
          if (!busy && slotsLeft > 0) {
            fileInputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!busy && slotsLeft > 0) {
              fileInputRef.current?.click()
            }
          }
        }}
        aria-label="Zona para arrastrar o seleccionar imágenes"
      >
        <ImageIcon className="service-images-modal__dropzone-icon" />
        <span className="service-images-modal__dropzone-title">
          {isProcessing
            ? 'Procesando imágenes…'
            : slotsLeft === 0
              ? 'Límite de imágenes alcanzado'
              : 'Arrastra imágenes aquí o haz clic para seleccionar'}
        </span>
        <span className="service-images-modal__dropzone-hint">
          Hasta {MAX_SERVICE_IMAGES} · máx. {MAX_IMAGE_FILE_BYTES / (1024 * 1024)} MB cada una ·
          WebP
        </span>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/*"
          multiple
          className="service-images-modal__file-input"
          disabled={busy || slotsLeft === 0}
          onChange={(event) => {
            const files = event.target.files
            if (files) {
              void processFiles(files)
            }
            event.target.value = ''
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="service-images-modal__thumbs" aria-label="Vista previa de imágenes">
          {items.map((image, index) => (
            <li
              key={image.id}
              className={classNames('service-images-modal__thumb', {
                'service-images-modal__thumb--cover': index === 0,
              })}
            >
              <img src={previewSrcForItem(image)} alt="" />
              <button
                type="button"
                className="service-images-modal__thumb-remove"
                aria-label={
                  image.kind === 'local' ? `Quitar ${image.fileName}` : 'Quitar imagen'
                }
                disabled={busy}
                onClick={() => {
                  removeImage(image.id)
                }}
              >
                <CloseIcon className="service-images-modal__thumb-remove-icon" />
              </button>
              <span className="service-images-modal__thumb-meta">
                {thumbMetaLabel(image, index)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="service-images-modal__youtube">
        <span>Vídeo de YouTube (opcional)</span>
        <input
          type="url"
          value={youtubeUrl}
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={busy}
          onChange={(event) => {
            setYoutubeUrl(event.target.value)
          }}
        />
      </label>

      {errorMessage ? (
        <p className="service-images-modal__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </Modal>
  )
}
