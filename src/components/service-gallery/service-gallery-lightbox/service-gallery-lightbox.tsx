import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import classNames from 'classnames'
import { CloseIcon } from '@components/icons/close-icon'
import { ZoomInIcon } from '@components/icons/zoom-in-icon'
import { ZoomOutIcon } from '@components/icons/zoom-out-icon'
import {
  GALLERY_ZOOM_MAX,
  GALLERY_ZOOM_MIN,
  clampGalleryZoom,
  zoomIn,
  zoomOut,
} from '../service-gallery.utils'
import type { ServiceGalleryLightboxProps } from './service-gallery-lightbox.types'
import './service-gallery-lightbox.css'

type PanOffset = { x: number; y: number }

export function ServiceGalleryLightbox({
  open,
  src,
  alt,
  onClose,
}: ServiceGalleryLightboxProps) {
  const [zoom, setZoom] = useState(GALLERY_ZOOM_MIN)
  const [offset, setOffset] = useState<PanOffset>({ x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setZoom((current) => zoomIn(current))
        return
      }
      if (event.key === '-') {
        event.preventDefault()
        setZoom((current) => {
          const next = zoomOut(current)
          if (next <= GALLERY_ZOOM_MIN) {
            setOffset({ x: 0, y: 0 })
          }
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const canZoomIn = zoom < GALLERY_ZOOM_MAX
  const canZoomOut = zoom > GALLERY_ZOOM_MIN
  const isPannable = zoom > GALLERY_ZOOM_MIN

  function handleZoomIn() {
    setZoom((current) => zoomIn(current))
  }

  function handleZoomOut() {
    setZoom((current) => {
      const next = zoomOut(current)
      if (next <= GALLERY_ZOOM_MIN) {
        setOffset({ x: 0, y: 0 })
      }
      return next
    })
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault()
    if (event.deltaY < 0) {
      setZoom((current) => zoomIn(current))
      return
    }
    setZoom((current) => {
      const next = zoomOut(current)
      if (next <= GALLERY_ZOOM_MIN) {
        setOffset({ x: 0, y: 0 })
      }
      return next
    })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isPannable) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    setOffset({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    })
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className="service-gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Vista ampliada"
    >
      <button
        type="button"
        className="service-gallery-lightbox__backdrop"
        aria-label="Cerrar vista ampliada"
        onClick={onClose}
      />

      <div className="service-gallery-lightbox__toolbar">
        <div className="service-gallery-lightbox__zoom-controls">
          <button
            type="button"
            className="service-gallery-lightbox__tool"
            aria-label="Alejar"
            disabled={!canZoomOut}
            onClick={handleZoomOut}
          >
            <ZoomOutIcon className="service-gallery-lightbox__tool-icon" />
          </button>
          <span className="service-gallery-lightbox__zoom-label" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="service-gallery-lightbox__tool"
            aria-label="Acercar"
            disabled={!canZoomIn}
            onClick={handleZoomIn}
          >
            <ZoomInIcon className="service-gallery-lightbox__tool-icon" />
          </button>
        </div>
        <button
          type="button"
          className="service-gallery-lightbox__tool"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <CloseIcon className="service-gallery-lightbox__tool-icon" />
        </button>
      </div>

      <div
        className={classNames('service-gallery-lightbox__stage', {
          'service-gallery-lightbox__stage--pannable': isPannable,
        })}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={src}
          alt={alt}
          className="service-gallery-lightbox__image"
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${clampGalleryZoom(zoom)})`,
          }}
        />
      </div>
    </div>
  )
}
