import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { ChevronLeftIcon } from '@components/icons/chevron-left-icon'
import { ChevronRightIcon } from '@components/icons/chevron-right-icon'
import { CloseIcon } from '@components/icons/close-icon'
import { ServiceGalleryLightbox } from './service-gallery-lightbox/service-gallery-lightbox'
import type { ServiceGalleryProps } from './service-gallery.types'
import {
  clampGalleryIndex,
  nextGalleryIndex,
  prevGalleryIndex,
} from './service-gallery.utils'
import './service-gallery.css'

export function ServiceGallery({
  open,
  images,
  initialIndex = 0,
  serviceName,
  onClose,
}: ServiceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    clampGalleryIndex(initialIndex, images.length),
  )
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const titleId = 'service-gallery-title'

  useEffect(() => {
    if (!open || lightboxOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setActiveIndex((current) => prevGalleryIndex(current, images.length))
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveIndex((current) => nextGalleryIndex(current, images.length))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, lightboxOpen, images.length, onClose])

  if (!open || images.length === 0) {
    return null
  }

  const safeIndex = clampGalleryIndex(activeIndex, images.length)
  const activeSrc = images[safeIndex]!
  const showNav = images.length > 1
  const counterLabel = `${safeIndex + 1} / ${images.length}`

  return (
    <div className="service-gallery" role="presentation">
      <button
        type="button"
        className="service-gallery__backdrop"
        aria-label="Cerrar galería"
        onClick={onClose}
      />

      <div
        className="service-gallery__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="service-gallery__header">
          <div className="service-gallery__heading">
            <h2 id={titleId} className="service-gallery__title">
              {serviceName}
            </h2>
            {showNav ? (
              <span className="service-gallery__counter" aria-live="polite">
                {counterLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="service-gallery__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon className="service-gallery__close-icon" />
          </button>
        </header>

        <div className="service-gallery__body">
          <div className="service-gallery__stage">
            {showNav ? (
              <button
                type="button"
                className="service-gallery__nav service-gallery__nav--prev"
                aria-label="Imagen anterior"
                onClick={() =>
                  setActiveIndex((current) =>
                    prevGalleryIndex(current, images.length),
                  )
                }
              >
                <ChevronLeftIcon className="service-gallery__nav-icon" />
              </button>
            ) : null}

            <button
              type="button"
              className="service-gallery__main-trigger"
              aria-label="Ampliar imagen a pantalla completa"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={activeSrc}
                alt={`${serviceName} — imagen ${safeIndex + 1}`}
                className="service-gallery__main-image"
              />
            </button>

            {showNav ? (
              <button
                type="button"
                className="service-gallery__nav service-gallery__nav--next"
                aria-label="Imagen siguiente"
                onClick={() =>
                  setActiveIndex((current) =>
                    nextGalleryIndex(current, images.length),
                  )
                }
              >
                <ChevronRightIcon className="service-gallery__nav-icon" />
              </button>
            ) : null}
          </div>

          {showNav ? (
            <ul className="service-gallery__thumbs" aria-label="Miniaturas">
              {images.map((src, index) => (
                <li key={`${src}-${index}`}>
                  <button
                    type="button"
                    className={classNames('service-gallery__thumb', {
                      'service-gallery__thumb--active': index === safeIndex,
                    })}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-current={index === safeIndex ? 'true' : undefined}
                    onClick={() => setActiveIndex(index)}
                  >
                    <img src={src} alt="" className="service-gallery__thumb-image" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {lightboxOpen ? (
        <ServiceGalleryLightbox
          key={activeSrc}
          open
          src={activeSrc}
          alt={`${serviceName} — imagen ${safeIndex + 1}`}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  )
}
