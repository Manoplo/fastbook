import classNames from 'classnames'
import { CheckIcon } from '@components/icons/check-icon'
import {
  isStartTimeOccupied,
  occupiedStartTimeSet,
} from '@src/lib/occupied-booking-slots.utils'
import type { TimeSlotsProps } from './time-slots.types'
import { buildSlotsForDay } from './time-slots.utils'
import './time-slots.css'

export function TimeSlots({
  date,
  value = null,
  onChange,
  windows,
  durationMinutes,
  occupiedStartTimes = [],
  eyebrow = 'Paso 2',
  title = '2. Franja horaria',
}: TimeSlotsProps) {
  const slots = date
    ? buildSlotsForDay({
        dayOfWeek: date.getDay(),
        windows,
        durationMinutes,
      })
    : []
  const occupied = occupiedStartTimeSet(occupiedStartTimes)

  const morning = slots.filter((slot) => slot.period === 'morning')
  const afternoon = slots.filter((slot) => slot.period === 'afternoon')

  function handleSelect(startTime: string) {
    if (!onChange || isStartTimeOccupied(startTime, occupied)) {
      return
    }
    onChange(value === startTime ? null : startTime)
  }

  function renderSlot(slot: { startTime: string }) {
    const selected = value === slot.startTime
    const disabled = isStartTimeOccupied(slot.startTime, occupied)
    return (
      <button
        key={slot.startTime}
        type="button"
        className={classNames('time-slots__slot', {
          'time-slots__slot--selected': selected && !disabled,
          'time-slots__slot--occupied': disabled,
        })}
        aria-pressed={selected && !disabled}
        aria-disabled={disabled}
        disabled={disabled}
        title={disabled ? 'Horario no disponible' : undefined}
        onClick={() => handleSelect(slot.startTime)}
      >
        {selected && !disabled ? (
          <CheckIcon className="time-slots__check" />
        ) : (
          <span className="time-slots__slot-dot" aria-hidden="true" />
        )}
        <span>{slot.startTime}</span>
      </button>
    )
  }

  return (
    <section className="time-slots" aria-label="Franja horaria">
      <div className="time-slots__header">
        <div>
          {eyebrow ? <span className="time-slots__eyebrow">{eyebrow}</span> : null}
          {title ? <h2 className="time-slots__title">{title}</h2> : null}
        </div>
        <span className="time-slots__live">
          <span className="time-slots__live-dot" aria-hidden="true" />
          Tiempo real
        </span>
      </div>

      {!date ? (
        <p className="time-slots__empty">Selecciona una fecha para ver los horarios.</p>
      ) : slots.length === 0 ? (
        <p className="time-slots__empty">No hay franjas disponibles este día.</p>
      ) : (
        <div className="time-slots__periods">
          {morning.length > 0 ? (
            <div className="time-slots__period">
              <span className="time-slots__period-label">Mañana</span>
              <div className="time-slots__grid" role="group" aria-label="Horarios de mañana">
                {morning.map(renderSlot)}
              </div>
            </div>
          ) : null}

          {afternoon.length > 0 ? (
            <div className="time-slots__period">
              <span className="time-slots__period-label">Tarde</span>
              <div className="time-slots__grid" role="group" aria-label="Horarios de tarde">
                {afternoon.map(renderSlot)}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
