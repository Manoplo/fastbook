import classNames from 'classnames'
import { AccountCircleIcon } from '@components/icons/account-circle-icon'
import { CheckIcon } from '@components/icons/check-icon'
import { MailIcon } from '@components/icons/mail-icon'
import { SmartphoneIcon } from '@components/icons/smartphone-icon'
import { VerifiedIcon } from '@components/icons/verified-icon'
import type { AgendaBookingCardProps } from './agenda-booking-card.types'
import {
  formatAgendaPrice,
  formatTimeHhMm,
  statusBadgeLabel,
  whatsappHref,
} from '../enterprise-agenda.utils'
import './agenda-booking-card.css'

export function AgendaBookingCard({ booking }: AgendaBookingCardProps) {
  const isLive = booking.uiStatus === 'in_progress'
  const whatsapp = booking.customerPhone
    ? whatsappHref(booking.customerPhone)
    : null

  return (
    <article
      className={classNames(
        'agenda-booking-card',
        `agenda-booking-card--${booking.uiStatus}`,
        { 'agenda-booking-card--live': isLive },
      )}
    >
      <div className="agenda-booking-card__time" aria-hidden="true">
        <span
          className={classNames('agenda-booking-card__time-start', {
            'agenda-booking-card__time-start--live': isLive,
          })}
        >
          {formatTimeHhMm(booking.startTime)}
        </span>
        <span className="agenda-booking-card__time-end">
          {formatTimeHhMm(booking.endTime)} ({booking.durationMinutes}m)
        </span>
      </div>

      <div className="agenda-booking-card__panel">
        <div className="agenda-booking-card__top">
          <div className="agenda-booking-card__badges">
            <span
              className={classNames(
                'agenda-booking-card__status',
                `agenda-booking-card__status--${booking.uiStatus}`,
              )}
            >
              {booking.uiStatus === 'completed' ? (
                <CheckIcon className="agenda-booking-card__status-icon" />
              ) : booking.uiStatus === 'in_progress' ? (
                <span className="agenda-booking-card__pulse" aria-hidden="true" />
              ) : (
                <VerifiedIcon className="agenda-booking-card__status-icon" />
              )}
              {statusBadgeLabel(booking.uiStatus)}
            </span>
            <span className="agenda-booking-card__ref">{booking.refLabel}</span>
          </div>
          <p className="agenda-booking-card__price">{formatAgendaPrice(booking.price)}</p>
        </div>

        <div className="agenda-booking-card__body">
          <div className="agenda-booking-card__customer">
            <div
              className={classNames('agenda-booking-card__avatar', {
                'agenda-booking-card__avatar--live': isLive,
              })}
            >
              <AccountCircleIcon className="agenda-booking-card__avatar-icon" />
            </div>
            <div className="agenda-booking-card__customer-copy">
              <h3 className="agenda-booking-card__name">{booking.customerName}</h3>
              <p className="agenda-booking-card__service">{booking.serviceName}</p>
              <div className="agenda-booking-card__meta">
                {booking.customerPhone ? (
                  <span className="agenda-booking-card__meta-item">
                    <SmartphoneIcon className="agenda-booking-card__meta-icon" />
                    {booking.customerPhone}
                  </span>
                ) : null}
                {booking.customerEmail ? (
                  <span className="agenda-booking-card__meta-item">
                    <MailIcon className="agenda-booking-card__meta-icon" />
                    {booking.customerEmail}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="agenda-booking-card__actions">
            {whatsapp ? (
              <a
                className="agenda-booking-card__action"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
            {booking.customerEmail ? (
              <a
                className="agenda-booking-card__action"
                href={`mailto:${booking.customerEmail}`}
              >
                Email
              </a>
            ) : null}
          </div>
        </div>

        {booking.notes ? (
          <div className="agenda-booking-card__notes">
            <strong>Nota:</strong> {booking.notes}
          </div>
        ) : null}
      </div>
    </article>
  )
}
