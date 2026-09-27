import type { ServiceListItem, ServiceListProps } from './service-list.types'
import {
  formatDurationMinutes,
  formatServicePrice,
  formatTagLabel,
} from './service-list.utils'
import './service-list.css'

function CheckIcon() {
  return (
    <svg className="service-list__check-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  )
}

function ScheduleIcon() {
  return (
    <svg className="service-list__meta-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
      />
    </svg>
  )
}

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
              <ScheduleIcon />
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
          {selected ? <CheckIcon /> : <span className="service-list__check-dot" />}
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
