import { hasSaasImplementation } from '@src/lib/feature-flags'
import { ArrowForwardIcon } from '@components/icons/arrow-forward-icon'
import { CalendarMonthIcon } from '@components/icons/calendar-month-icon'
import { CheckIcon } from '@components/icons/check-icon'
import { EventAvailableIcon } from '@components/icons/event-available-icon'
import { LockIcon } from '@components/icons/lock-icon'
import { PaymentsIcon } from '@components/icons/payments-icon'
import { ScheduleIcon } from '@components/icons/schedule-icon'
import { VerifiedIcon } from '@components/icons/verified-icon'
import { formatDurationMinutes } from '@components/service-list/service-list.utils'
import type { BookingSummaryCardProps } from './booking-summary-card.types'
import {
  formatSummaryDate,
  formatSummaryPrice,
  formatSummaryTimeLabel,
} from './booking-summary-card.utils'
import './booking-summary-card.css'

export function BookingSummaryCard({
  serviceName,
  durationMinutes,
  dateKey,
  startTime,
  price,
  imageUrl,
  canConfirm = false,
  isSubmitting = false,
  submitError = null,
  formId = 'customer-details-form',
  onEdit,
}: BookingSummaryCardProps) {
  const formattedPrice = formatSummaryPrice(price)
  const confirmLabel = isSubmitting
    ? 'Confirmando reserva…'
    : !canConfirm
      ? 'Rellena el formulario para continuar'
      : hasSaasImplementation
        ? 'Continuar al pago'
        : 'Confirmar reserva y generar QR'

  return (
    <aside className="booking-summary-card" aria-label="Resumen de tu cita">
      <div className="booking-summary-card__panel">
        <header className="booking-summary-card__header">
          <div className="booking-summary-card__header-main">
            <EventAvailableIcon className="booking-summary-card__header-icon" />
            <h2 className="booking-summary-card__title">Resumen de tu cita</h2>
          </div>
          <span className="booking-summary-card__badge">Slot reservado</span>
        </header>

        <div className="booking-summary-card__body">
          <div className="booking-summary-card__service">
            <div className="booking-summary-card__service-media">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="booking-summary-card__service-image"
                />
              ) : (
                <EventAvailableIcon className="booking-summary-card__service-fallback-icon" />
              )}
            </div>
            <div className="booking-summary-card__service-text">
              <h3 className="booking-summary-card__service-name">{serviceName}</h3>
              <div className="booking-summary-card__service-meta">
                <span className="booking-summary-card__meta-item">
                  <ScheduleIcon className="booking-summary-card__meta-icon" />
                  {formatDurationMinutes(durationMinutes)}
                </span>
                <span className="booking-summary-card__meta-dot" aria-hidden="true" />
                <span className="booking-summary-card__meta-item booking-summary-card__meta-item--accent">
                  Confirmación inmediata
                </span>
              </div>
            </div>
          </div>

          <div className="booking-summary-card__datetime">
            <div className="booking-summary-card__datetime-icon-wrap">
              <CalendarMonthIcon className="booking-summary-card__datetime-icon" />
            </div>
            <div>
              <p className="booking-summary-card__datetime-label">Día y hora</p>
              <p className="booking-summary-card__datetime-date">
                {formatSummaryDate(dateKey)}
              </p>
              <p className="booking-summary-card__datetime-time">
                {formatSummaryTimeLabel(startTime)}
              </p>
            </div>
          </div>

          <div className="booking-summary-card__divider" aria-hidden="true" />

          <div className="booking-summary-card__pricing">
            <div className="booking-summary-card__price-row">
              <span>Precio del servicio</span>
              <span className="booking-summary-card__price-value">{formattedPrice}</span>
            </div>

            {hasSaasImplementation ? (
              <>
                <div className="booking-summary-card__price-row">
                  <span className="booking-summary-card__price-row-label">
                    Gestión de reserva online
                    <CheckIcon className="booking-summary-card__check-icon" />
                  </span>
                  <span className="booking-summary-card__price-free">Gratis</span>
                </div>

                <div className="booking-summary-card__total">
                  <div>
                    <p className="booking-summary-card__total-label">Total a abonar</p>
                    <p className="booking-summary-card__total-hint">
                      Al confirmar, continuarás a la plataforma de pago
                    </p>
                  </div>
                  <div className="booking-summary-card__total-amount">
                    <span className="booking-summary-card__total-price">
                      {formattedPrice}
                    </span>
                    <span className="booking-summary-card__total-tax">IVA incluido</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="booking-summary-card__free-notice" role="status">
                <p className="booking-summary-card__free-notice-title">
                  No tienes que pagar nada
                </p>
                <p className="booking-summary-card__free-notice-text">
                  Esta reserva es gratuita y no incluye cobro online. Confirma tus datos
                  y genera tu acceso QR sin pasar por ninguna pasarela de pago.
                </p>
              </div>
            )}
          </div>

          <div className="booking-summary-card__actions">
            {submitError ? (
              <p className="booking-summary-card__submit-error" role="alert">
                {submitError}
              </p>
            ) : null}
            <button
              type="submit"
              form={formId}
              className="booking-summary-card__confirm"
              disabled={!canConfirm || isSubmitting}
            >
              <span>{confirmLabel}</span>
              {canConfirm && !isSubmitting ? (
                <ArrowForwardIcon className="booking-summary-card__confirm-icon" />
              ) : null}
            </button>
            <button
              type="button"
              className="booking-summary-card__edit"
              onClick={onEdit}
            >
              ← Modificar fecha o servicio
            </button>
          </div>
        </div>

        <ul className="booking-summary-card__trust">
          <li className="booking-summary-card__trust-item">
            <VerifiedIcon className="booking-summary-card__trust-icon booking-summary-card__trust-icon--tertiary" />
            <span>Cancelación gratuita hasta 24h antes de la cita</span>
          </li>
          <li className="booking-summary-card__trust-item">
            <LockIcon className="booking-summary-card__trust-icon booking-summary-card__trust-icon--primary" />
            <span>Conexión segura SSL cifrada punto a punto</span>
          </li>
          <li className="booking-summary-card__trust-item">
            <PaymentsIcon className="booking-summary-card__trust-icon booking-summary-card__trust-icon--secondary" />
            <span>
              {hasSaasImplementation
                ? 'Pago seguro a través de la plataforma de pago'
                : 'Sin cobro online · Reserva gratuita'}
            </span>
          </li>
        </ul>
      </div>
    </aside>
  )
}
