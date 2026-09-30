import { ArrowForwardIcon } from '../icons/arrow-forward-icon'
import { EventAvailableIcon } from '../icons/event-available-icon'
import {
  formatDurationMinutes,
  formatServicePrice,
} from '../service-list/service-list.utils'
import type { BookingContinueBarProps } from './booking-continue-bar.types'
import { formatContinueBarDate } from './booking-continue-bar.utils'
import './booking-continue-bar.css'

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
            <EventAvailableIcon className="booking-continue-bar__icon" />
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
            <ArrowForwardIcon className="booking-continue-bar__arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}
