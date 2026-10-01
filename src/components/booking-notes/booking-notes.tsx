import { CheckCircleIcon } from '@components/icons/check-circle-icon'
import { UpdateIcon } from '@components/icons/update-icon'
import { VerifiedIcon } from '@components/icons/verified-icon'
import type { BookingNotesProps } from './booking-notes.types'
import './booking-notes.css'

const TRUST_BADGES = [
  {
    id: 'sms',
    label: 'Confirmación SMS instantánea',
    icon: CheckCircleIcon,
    tone: 'tertiary' as const,
  },
  {
    id: 'cancel',
    label: 'Cancelación libre 24h antes',
    icon: UpdateIcon,
    tone: 'primary' as const,
  },
  {
    id: 'pay',
    label: 'Pago seguro garantizado',
    icon: VerifiedIcon,
    tone: 'primary' as const,
  },
]

export function BookingNotes({
  value = '',
  onChange,
  placeholder = 'Ej. Preferencia de horario flexible, primera visita o alergias conocidas…',
}: BookingNotesProps) {
  return (
    <section className="booking-notes" aria-label="Comentarios y garantías">
      <div className="booking-notes__header">
        <label className="booking-notes__title" htmlFor="booking-notes-field">
          Comentarios o peticiones especiales
        </label>
        <span className="booking-notes__optional">Opcional</span>
      </div>

      <textarea
        id="booking-notes-field"
        className="booking-notes__textarea"
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />

      <ul className="booking-notes__badges">
        {TRUST_BADGES.map((badge) => {
          const Icon = badge.icon
          return (
            <li
              key={badge.id}
              className={`booking-notes__badge booking-notes__badge--${badge.tone}`}
            >
              <Icon className="booking-notes__badge-icon" />
              <span>{badge.label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
