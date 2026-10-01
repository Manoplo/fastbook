import classNames from 'classnames'
import { CheckIcon } from '@components/icons/check-icon'
import type { TimeSlotsProps } from './time-slots.types'
import { buildSlotsForDay } from './time-slots.utils'
import './time-slots.css'

export function TimeSlots({
  date,
  value = null,
  onChange,
  windows,
  durationMinutes,
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

  const morning = slots.filter((slot) => slot.period === 'morning')
  const afternoon = slots.filter((slot) => slot.period === 'afternoon')

  function handleSelect(startTime: string) {
    if (!onChange) {
      return
    }
    onChange(value === startTime ? null : startTime)
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
                {morning.map((slot) => {
                  const selected = value === slot.startTime
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      className={classNames('time-slots__slot', {
                        'time-slots__slot--selected': selected,
                      })}
                      aria-pressed={selected}
                      onClick={() => handleSelect(slot.startTime)}
                    >
                      {selected ? (
                        <CheckIcon className="time-slots__check" />
                      ) : (
                        <span className="time-slots__slot-dot" aria-hidden="true" />
                      )}
                      <span>{slot.startTime}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {afternoon.length > 0 ? (
            <div className="time-slots__period">
              <span className="time-slots__period-label">Tarde</span>
              <div className="time-slots__grid" role="group" aria-label="Horarios de tarde">
                {afternoon.map((slot) => {
                  const selected = value === slot.startTime
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      className={classNames('time-slots__slot', {
                        'time-slots__slot--selected': selected,
                      })}
                      aria-pressed={selected}
                      onClick={() => handleSelect(slot.startTime)}
                    >
                      {selected ? (
                        <CheckIcon className="time-slots__check" />
                      ) : (
                        <span className="time-slots__slot-dot" aria-hidden="true" />
                      )}
                      <span>{slot.startTime}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
