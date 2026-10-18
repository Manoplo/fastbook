import { useId, useRef, useState } from 'react'
import classNames from 'classnames'
import { CloseIcon } from '@components/icons/close-icon'
import { ImageIcon } from '@components/icons/image-icon'
import { Modal } from '@components/modal/modal'
import type { ServiceImageDraft, ServiceImagesModalProps } from './service-images-modal.types'
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

export function ServiceImagesModal({
  open,
  onClose,
  serviceLabel,
}: ServiceImagesModalProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ServiceImageDraft[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function resetDrafts() {
    for (const image of images) {
      URL.revokeObjectURL(image.previewUrl)
    }
    setImages([])
    setYoutubeUrl('')
    setIsDragging(false)
    setIsProcessing(false)
    setErrorMessage(null)
  }

  function handleClose() {
    resetDrafts()
    onClose()
  }

  async function processFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (incoming.length === 0) {
      return
    }

    const { accepted, rejectedForLimit } = takeFilesWithinLimit(images.length, incoming)
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

    const prepared: ServiceImageDraft[] = []
    try {
      for (const file of validFiles) {
        const converted = await convertFileToWebp(file)
        const previewUrl = URL.createObjectURL(converted.blob)
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagen'
        prepared.push({
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

      setImages((prev) => [...prev, ...prepared])
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
    setImages((prev) => {
      const target = prev.find((image) => image.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((image) => image.id !== id)
    })
    setErrorMessage(null)
  }

  const slotsLeft = MAX_SERVICE_IMAGES - images.length
  const title = serviceLabel
    ? `Galería · ${serviceLabel}`
    : 'Galería del servicio'

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleClose}
      titleId="service-images-modal-title"
      className="service-images-modal"
      footer={
        <>
          <button type="button" className="service-images-modal__secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="service-images-modal__primary"
            disabled
            title="La subida se activará en una próxima iteración"
          >
            Guardar galería
          </button>
        </>
      }
    >
      <p className="service-images-modal__lead">
        Arrastra hasta {MAX_SERVICE_IMAGES} imágenes o selecciónalas desde tu dispositivo. Se
        convertirán a WebP antes de subirlas.
      </p>

      <div
        className={classNames('service-images-modal__dropzone', {
          'service-images-modal__dropzone--active': isDragging,
          'service-images-modal__dropzone--disabled': isProcessing || slotsLeft === 0,
        })}
        onDragEnter={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (slotsLeft > 0 && !isProcessing) {
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
          if (isProcessing || slotsLeft === 0) {
            return
          }
          void processFiles(event.dataTransfer.files)
        }}
        onClick={() => {
          if (!isProcessing && slotsLeft > 0) {
            fileInputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!isProcessing && slotsLeft > 0) {
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
          disabled={isProcessing || slotsLeft === 0}
          onChange={(event) => {
            const files = event.target.files
            if (files) {
              void processFiles(files)
            }
            event.target.value = ''
          }}
        />
      </div>

      {images.length > 0 ? (
        <ul className="service-images-modal__thumbs" aria-label="Vista previa de imágenes">
          {images.map((image) => (
            <li key={image.id} className="service-images-modal__thumb">
              <img src={image.previewUrl} alt="" />
              <button
                type="button"
                className="service-images-modal__thumb-remove"
                aria-label={`Quitar ${image.fileName}`}
                onClick={() => {
                  removeImage(image.id)
                }}
              >
                <CloseIcon className="service-images-modal__thumb-remove-icon" />
              </button>
              <span className="service-images-modal__thumb-meta">
                {(image.compressedSize / 1024).toFixed(0)} KB
                {image.usedWebp ? '' : ' · JPEG'}
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

      <p className="service-images-modal__footnote">
        La subida a Storage se activará en breve. Por ahora puedes probar la selección y la
        compresión.
      </p>
    </Modal>
  )
}
