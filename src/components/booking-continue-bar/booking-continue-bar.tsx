import {
  formatDurationMinutes,
  formatServicePrice,
} from '../service-list/service-list.utils'
import type { BookingContinueBarProps } from './booking-continue-bar.types'
import { formatContinueBarDate } from './booking-continue-bar.utils'
import './booking-continue-bar.css'

function EventAvailableIcon() {
  return (
    <svg className="booking-continue-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"
      />
    </svg>
  )
}

function ArrowForwardIcon() {
  return (
    <svg
      className="booking-continue-bar__arrow"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
      />
    </svg>
  )
}

export function BookingContinueBar({
  serviceName,
  durationMinutes,
  dateKey,
  startTime,
  price,
  onContinue,
}: BookingContinueBarProps) {
  return (
    <div className="booking-continue-bar" role="region" aria-label="Resumen de selección">
      <div className="booking-continue-bar__card">
        <div className="booking-continue-bar__summary">
          <div className="booking-continue-bar__icon-wrap">
            <EventAvailableIcon />
          </div>
          <div className="booking-continue-bar__text">
            <div className="booking-continue-bar__title-row">
              <span className="booking-continue-bar__service">{serviceName}</span>
              <span className="booking-continue-bar__duration">
                {formatDurationMinutes(durationMinutes)}
              </span>
            </div>
            <p className="booking-continue-bar__meta">
              {formatContinueBarDate(dateKey, startTime)}
            </p>
          </div>
        </div>

        <div className="booking-continue-bar__action">
          <div className="booking-continue-bar__price">
            <span className="booking-continue-bar__price-label">Importe total</span>
            <span className="booking-continue-bar__price-value">
              {formatServicePrice(price)}
            </span>
          </div>
          <button
            type="button"
            className="booking-continue-bar__button"
            onClick={onContinue}
          >
            <span>Continuar con la reserva</span>
            <ArrowForwardIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
