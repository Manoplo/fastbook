import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import classNames from 'classnames'
import { CheckIcon } from '@components/icons/check-icon'
import { ScheduleIcon } from '@components/icons/schedule-icon'
import { ServiceGallery } from '@components/service-gallery/service-gallery'
import { resolveServiceGalleryUrls } from '@components/service-gallery/service-gallery.utils'
import type { ServiceListItem, ServiceListProps } from './service-list.types'
import {
  formatDurationMinutes,
  formatServicePrice,
  formatTagLabel,
} from './service-list.utils'
import './service-list.css'

type GalleryState = {
  serviceName: string
  images: string[]
}

function ServiceCard({
  service,
  selected,
  onSelect,
  onOpenGallery,
}: {
  service: ServiceListItem
  selected: boolean
  onSelect: () => void
  onOpenGallery: (images: string[]) => void
}) {
  const tags = service.tags ?? []
  const galleryImages = resolveServiceGalleryUrls(
    service.image_url,
    service.image_urls,
  )
  const hasImage = galleryImages.length > 0
  const coverSrc = galleryImages[0]
  const extraCount = galleryImages.length > 1 ? galleryImages.length : 0

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      className={classNames('service-list__card', {
        'service-list__card--selected': selected,
        'service-list__card--no-image': !hasImage,
      })}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
    >
      <div className="service-list__card-main">
        {hasImage && coverSrc ? (
          <button
            type="button"
            className="service-list__thumb"
            aria-label={`Ver galería de ${service.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onOpenGallery(galleryImages)
            }}
          >
            <img
              src={coverSrc}
              alt=""
              className="service-list__thumb-image"
            />
            {extraCount > 1 ? (
              <span className="service-list__thumb-count" aria-hidden="true">
                {extraCount}
              </span>
            ) : null}
          </button>
        ) : null}

        <div className="service-list__content">
          {tags.length > 0 ? (
            <div className="service-list__tags">
              {tags.map((tag) => (
                <span key={tag} className="service-list__tag">
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>
          ) : null}

          <h3 className="service-list__name">{service.name}</h3>

          {service.description ? (
            <p className="service-list__description">{service.description}</p>
          ) : null}

          <div className="service-list__meta">
            <span className="service-list__meta-item">
              <ScheduleIcon className="service-list__meta-icon" />
              {formatDurationMinutes(service.duration_minutes)}
            </span>
          </div>
        </div>
      </div>

      <div className="service-list__aside">
        <div className="service-list__price-block">
          <span className="service-list__price-label">Total</span>
          <span
            className={classNames('service-list__price', {
              'service-list__price--selected': selected,
            })}
          >
            {formatServicePrice(service.price)}
          </span>
        </div>

        <span
          className={classNames('service-list__check', {
            'service-list__check--selected': selected,
          })}
          aria-hidden="true"
        >
          {selected ? (
            <CheckIcon className="service-list__check-icon" />
          ) : (
            <span className="service-list__check-dot" />
          )}
        </span>
      </div>
    </div>
  )
}

export function ServiceList({
  services,
  value = null,
  onChange,
  eyebrow = 'Paso 3',
  title = '3. Experiencia & servicios',
  subtitle = 'Selecciona el tratamiento adaptado a tus necesidades',
}: ServiceListProps) {
  const [gallery, setGallery] = useState<GalleryState | null>(null)

  const countLabel =
    services.length === 1
      ? '1 tratamiento disponible'
      : `${services.length} tratamientos disponibles`

  function handleSelect(serviceId: string) {
    if (!onChange) {
      return
    }
    onChange(value === serviceId ? null : serviceId)
  }

  return (
    <section className="service-list" aria-label="Servicios">
      <div className="service-list__header">
        <div>
          {eyebrow ? <span className="service-list__eyebrow">{eyebrow}</span> : null}
          {title ? <h2 className="service-list__title">{title}</h2> : null}
          {subtitle ? <p className="service-list__subtitle">{subtitle}</p> : null}
        </div>
        <span className="service-list__count">{countLabel}</span>
      </div>

      {services.length === 0 ? (
        <p className="service-list__empty">No hay servicios disponibles.</p>
      ) : (
        <div className="service-list__cards">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={value === service.id}
              onSelect={() => handleSelect(service.id)}
              onOpenGallery={(images) =>
                setGallery({ serviceName: service.name, images })
              }
            />
          ))}
        </div>
      )}

      {gallery ? (
        <ServiceGallery
          key={`${gallery.serviceName}-${gallery.images.join('|')}`}
          open
          images={gallery.images}
          serviceName={gallery.serviceName}
          onClose={() => setGallery(null)}
        />
      ) : null}
    </section>
  )
}
