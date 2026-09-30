import { useState } from 'react'
import { ChevronLeftIcon } from '../icons/chevron-left-icon'
import { ChevronRightIcon } from '../icons/chevron-right-icon'
import type { CalendarProps } from './calendar.types'
import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  formatSelectedLabel,
  startOfDay,
  toDateKey,
} from './calendar.utils'
import './calendar.css'

export function Calendar({
  value = null,
  onChange,
  availableDates,
  minDate,
  eyebrow = 'Paso 1',
  title = 'Selecciona tu fecha',
}: CalendarProps) {
  const [today] = useState(() => startOfDay(new Date()))
  const effectiveMinDate = minDate ? startOfDay(minDate) : today
  const [viewMonth, setViewMonth] = useState(() =>
    startOfDay(value ?? today),
  )

  const availableKeys = availableDates
    ? new Set(availableDates.map((date) => toDateKey(startOfDay(date))))
    : null

  const days = buildMonthGrid({
    viewMonth,
    selected: value,
    today,
    minDate: effectiveMinDate,
    availableKeys,
  })

  const canGoPrev =
    viewMonth.getFullYear() > effectiveMinDate.getFullYear() ||
    (viewMonth.getFullYear() === effectiveMinDate.getFullYear() &&
      viewMonth.getMonth() > effectiveMinDate.getMonth())

  function handleSelect(dayDate: Date, selectable: boolean) {
    if (!selectable || !onChange) {
      return
    }
    onChange(startOfDay(dayDate))
  }

  return (
    <section className="calendar" aria-label="Calendario de reserva">
      <div className="calendar__header">
        <div>
          {eyebrow ? <span className="calendar__eyebrow">{eyebrow}</span> : null}
          {title ? <h2 className="calendar__title">{title}</h2> : null}
        </div>

        <div className="calendar__month-nav">
          <button
            type="button"
            className="calendar__nav-button"
            aria-label="Mes anterior"
            disabled={!canGoPrev}
            onClick={() => setViewMonth((month) => addMonths(month, -1))}
          >
            <ChevronLeftIcon className="calendar__nav-icon" />
          </button>
          <span className="calendar__month-label" aria-live="polite">
            {formatMonthYear(viewMonth)}
          </span>
          <button
            type="button"
            className="calendar__nav-button"
            aria-label="Mes siguiente"
            onClick={() => setViewMonth((month) => addMonths(month, 1))}
          >
            <ChevronRightIcon className="calendar__nav-icon" />
          </button>
        </div>
      </div>

      <div className="calendar__body">
        <div className="calendar__weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="calendar__weekday">
              {label}
            </span>
          ))}
        </div>

        <div className="calendar__grid" role="grid" aria-label={formatMonthYear(viewMonth)}>
          {days.map((day) => {
            const selectable = day.isCurrentMonth && day.isAvailable && !day.isPast
            const className = [
              'calendar__day',
              !day.isCurrentMonth ? 'calendar__day--outside' : '',
              day.isPast || !day.isCurrentMonth ? 'calendar__day--disabled' : '',
              day.isSelected ? 'calendar__day--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={toDateKey(day.date)}
                type="button"
                className={className}
                disabled={!selectable}
                aria-label={day.date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                aria-pressed={day.isSelected}
                onClick={() => handleSelect(day.date, selectable)}
              >
                <span className="calendar__day-number">{day.dayNumber}</span>
                {day.isAvailable && day.isCurrentMonth ? (
                  <span className="calendar__day-dot" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendar__legend">
        <div className="calendar__legend-item calendar__legend-item--selected">
          <span className="calendar__legend-dot calendar__legend-dot--selected" />
          <span>
            {value
              ? `Seleccionado: ${formatSelectedLabel(value)}`
              : 'Seleccionado: —'}
          </span>
        </div>
        <div className="calendar__legend-item calendar__legend-item--available">
          <span className="calendar__legend-dot calendar__legend-dot--available" />
          <span>Disponible</span>
        </div>
      </div>
    </section>
  )
}
