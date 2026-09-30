import { CheckIcon } from '../icons/check-icon'
import { ScheduleIcon } from '../icons/schedule-icon'
import type { ServiceListItem, ServiceListProps } from './service-list.types'
import {
  formatDurationMinutes,
  formatServicePrice,
  formatTagLabel,
} from './service-list.utils'
import './service-list.css'

function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: ServiceListItem
  selected: boolean
  onSelect: () => void
}) {
  const tags = service.tags ?? []
  const hasImage = Boolean(service.image_url)

  return (
    <button
      type="button"
      className={[
        'service-list__card',
        selected ? 'service-list__card--selected' : '',
        !hasImage ? 'service-list__card--no-image' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="service-list__card-main">
        {hasImage ? (
          <div className="service-list__thumb">
            <img
              src={service.image_url!}
              alt=""
              className="service-list__thumb-image"
            />
          </div>
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
            className={[
              'service-list__price',
              selected ? 'service-list__price--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {formatServicePrice(service.price)}
          </span>
        </div>

        <span
          className={[
            'service-list__check',
            selected ? 'service-list__check--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          {selected ? (
            <CheckIcon className="service-list__check-icon" />
          ) : (
            <span className="service-list__check-dot" />
          )}
        </span>
      </div>
    </button>
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
            />
          ))}
        </div>
      )}
    </section>
  )
}
