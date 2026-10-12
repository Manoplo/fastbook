import { useState } from 'react'
import classNames from 'classnames'
import { AddIcon } from '@components/icons/add-icon'
import { CalendarMonthIcon } from '@components/icons/calendar-month-icon'
import { ChevronLeftIcon } from '@components/icons/chevron-left-icon'
import { ChevronRightIcon } from '@components/icons/chevron-right-icon'
import { PaymentsIcon } from '@components/icons/payments-icon'
import { ScheduleIcon } from '@components/icons/schedule-icon'
import type { AgendaStatusFilter } from './enterprise-agenda.types'
import {
  AGENDA_STATUS_FILTERS,
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  buildMonthGrid,
  formatAgendaDateLabel,
  formatMonthYear,
  startOfDay,
  toDateKey,
} from './enterprise-agenda.utils'
import './enterprise-agenda.css'

export function EnterpriseAgenda() {
  const [today] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()))
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>('all')
  const [search, setSearch] = useState('')

  const days = buildMonthGrid({
    viewMonth,
    selected: selectedDate,
    today,
    minDate: new Date(1970, 0, 1),
    availableKeys: null,
  })

  const bookingCount = 0
  const projectedRevenueLabel = '—'

  return (
    <div className="enterprise-agenda">
      <section className="enterprise-agenda__toolbar">
        <div className="enterprise-agenda__toolbar-inner">
          <div className="enterprise-agenda__date-block">
            <div className="enterprise-agenda__date-nav" role="group" aria-label="Cambiar día">
              <button
                type="button"
                className="enterprise-agenda__date-nav-btn"
                aria-label="Día anterior"
                onClick={() => {
                  const next = addDays(selectedDate, -1)
                  setSelectedDate(next)
                  setViewMonth(next)
                }}
              >
                <ChevronLeftIcon className="enterprise-agenda__date-nav-icon" />
              </button>
              <button
                type="button"
                className="enterprise-agenda__date-nav-today"
                onClick={() => {
                  setSelectedDate(today)
                  setViewMonth(today)
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                className="enterprise-agenda__date-nav-btn"
                aria-label="Día siguiente"
                onClick={() => {
                  const next = addDays(selectedDate, 1)
                  setSelectedDate(next)
                  setViewMonth(next)
                }}
              >
                <ChevronRightIcon className="enterprise-agenda__date-nav-icon" />
              </button>
            </div>
            <div className="enterprise-agenda__date-copy">
              <span className="enterprise-agenda__date-eyebrow">Gestión de Agenda</span>
              <p className="enterprise-agenda__date-label">{formatAgendaDateLabel(selectedDate)}</p>
            </div>
          </div>

          <div className="enterprise-agenda__stats">
            <div className="enterprise-agenda__stat">
              <CalendarMonthIcon className="enterprise-agenda__stat-icon enterprise-agenda__stat-icon--primary" />
              <p className="enterprise-agenda__stat-text">
                <span className="enterprise-agenda__stat-value">{bookingCount}</span>
                <span className="enterprise-agenda__stat-label">Citas hoy</span>
              </p>
            </div>
            <div className="enterprise-agenda__stat">
              <PaymentsIcon className="enterprise-agenda__stat-icon enterprise-agenda__stat-icon--success" />
              <p className="enterprise-agenda__stat-text">
                <span className="enterprise-agenda__stat-value">{projectedRevenueLabel}</span>
                <span className="enterprise-agenda__stat-label">Previsto</span>
              </p>
            </div>
          </div>

          <div className="enterprise-agenda__actions">
            <button type="button" className="enterprise-agenda__primary-btn" disabled title="Próximamente">
              <AddIcon className="enterprise-agenda__primary-btn-icon" />
              Nueva Cita
            </button>
          </div>
        </div>
      </section>

      <div className="enterprise-agenda__body">
        <aside className="enterprise-agenda__sidebar">
          <label className="enterprise-agenda__search">
            <span className="visually-hidden">Buscar citas</span>
            <input
              className="enterprise-agenda__search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cliente, teléfono o nº reserva…"
            />
          </label>

          <section className="enterprise-agenda__mini-calendar" aria-label="Calendario">
            <div className="enterprise-agenda__mini-calendar-header">
              <h2 className="enterprise-agenda__panel-title">{formatMonthYear(viewMonth)}</h2>
              <div className="enterprise-agenda__mini-calendar-nav">
                <button
                  type="button"
                  className="enterprise-agenda__date-nav-btn"
                  aria-label="Mes anterior"
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                >
                  <ChevronLeftIcon className="enterprise-agenda__date-nav-icon" />
                </button>
                <button
                  type="button"
                  className="enterprise-agenda__date-nav-btn"
                  aria-label="Mes siguiente"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                >
                  <ChevronRightIcon className="enterprise-agenda__date-nav-icon" />
                </button>
              </div>
            </div>

            <div className="enterprise-agenda__weekday-row" aria-hidden="true">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label.slice(0, 1)}</span>
              ))}
            </div>

            <div className="enterprise-agenda__day-grid">
              {days.map((day) => (
                <button
                  key={toDateKey(day.date)}
                  type="button"
                  className={classNames('enterprise-agenda__day', {
                    'enterprise-agenda__day--selected': day.isSelected,
                    'enterprise-agenda__day--today': day.isToday && !day.isSelected,
                    'enterprise-agenda__day--muted': !day.isCurrentMonth,
                  })}
                  onClick={() => {
                    setSelectedDate(startOfDay(day.date))
                    if (!day.isCurrentMonth) {
                      setViewMonth(startOfDay(day.date))
                    }
                  }}
                >
                  {day.dayNumber}
                </button>
              ))}
            </div>
          </section>

          <section className="enterprise-agenda__filters" aria-label="Filtrar estado">
            <h2 className="enterprise-agenda__panel-title">Filtrar Estado</h2>
            <ul className="enterprise-agenda__filter-list">
              {AGENDA_STATUS_FILTERS.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={classNames('enterprise-agenda__filter', {
                      'enterprise-agenda__filter--active': statusFilter === option.id,
                    })}
                    onClick={() => setStatusFilter(option.id)}
                  >
                    <span
                      className={classNames(
                        'enterprise-agenda__filter-dot',
                        `enterprise-agenda__filter-dot--${option.tone}`,
                      )}
                    />
                    <span className="enterprise-agenda__filter-label">{option.label}</span>
                    <span className="enterprise-agenda__filter-count">0</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="enterprise-agenda__timeline" aria-label="Línea temporal de citas">
          <header className="enterprise-agenda__timeline-header">
            <div className="enterprise-agenda__timeline-title-wrap">
              <ScheduleIcon className="enterprise-agenda__timeline-icon" />
              <h2 className="enterprise-agenda__timeline-title">Línea Temporal de Citas</h2>
            </div>
            <p className="enterprise-agenda__timeline-meta">
              Rango activo: <strong>09:00 – 20:00</strong>
              <span aria-hidden="true"> · </span>
              Zona horaria: <strong>Madrid (CET)</strong>
            </p>
          </header>

          <div className="enterprise-agenda__empty">
            <p className="enterprise-agenda__empty-title">No hay citas para este día</p>
            <p className="enterprise-agenda__empty-text">
              Cuando lleguen reservas desde tu página pública, aparecerán aquí en la línea temporal.
              {search.trim() ? ' Prueba a limpiar la búsqueda si esperabas resultados.' : null}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
