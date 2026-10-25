import { QRCodeSVG } from 'qrcode.react'
import { CheckCircleIcon } from '@components/icons/check-circle-icon'
import {
  formatSummaryDate,
  formatSummaryTimeLabel,
} from '@components/booking-summary-card/booking-summary-card.utils'
import { buildBookingCheckInUrl } from '@src/lib/booking-check-in.utils'
import type { BookingConfirmationProps } from './booking-confirmation.types'
import './booking-confirmation.css'

export function BookingConfirmation({
  tenantName,
  tenantSlug,
  serviceName,
  dateKey,
  startTime,
  customerEmail,
  checkInToken,
  onNewBooking,
}: BookingConfirmationProps) {
  const checkInUrl = buildBookingCheckInUrl({
    origin: window.location.origin,
    tenantSlug,
    checkInToken,
  })

  return (
    <section className="booking-confirmation" aria-label="Reserva confirmada">
      <div className="booking-confirmation__icon-wrap">
        <CheckCircleIcon className="booking-confirmation__icon" />
      </div>
      <h2 className="booking-confirmation__title">¡Reserva confirmada!</h2>
      <p className="booking-confirmation__subtitle">
        Tu cita en {tenantName} ya está guardada. Te enviaremos el comprobante y el acceso
        QR a <strong>{customerEmail}</strong>.
      </p>

      <div className="booking-confirmation__qr" aria-label="Código QR de acceso">
        <QRCodeSVG
          value={checkInUrl}
          size={168}
          level="M"
          marginSize={2}
          title="Código QR de tu reserva"
        />
        <p className="booking-confirmation__qr-hint">
          Muestra este código en el local el día de tu cita.
        </p>
      </div>

      <dl className="booking-confirmation__details">
        <div className="booking-confirmation__row">
          <dt>Servicio</dt>
          <dd>{serviceName}</dd>
        </div>
        <div className="booking-confirmation__row">
          <dt>Fecha</dt>
          <dd>{formatSummaryDate(dateKey)}</dd>
        </div>
        <div className="booking-confirmation__row">
          <dt>Hora</dt>
          <dd>{formatSummaryTimeLabel(startTime)}</dd>
        </div>
      </dl>

      <button type="button" className="booking-confirmation__button" onClick={onNewBooking}>
        Hacer otra reserva
      </button>
    </section>
  )
}
