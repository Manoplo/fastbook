import type { BookingNotesProps } from './booking-notes.types'
import './booking-notes.css'

function CheckCircleIcon() {
  return (
    <svg className="booking-notes__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
      />
    </svg>
  )
}

function UpdateIcon() {
  return (
    <svg className="booking-notes__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 0 1 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"
      />
    </svg>
  )
}

function VerifiedIcon() {
  return (
    <svg className="booking-notes__badge-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
      />
    </svg>
  )
}

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
              <Icon />
              <span>{badge.label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
