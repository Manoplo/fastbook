import { useState } from 'react'
import classNames from 'classnames'
import { useQuery } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { AddIcon } from '@components/icons/add-icon'
import { CalendarMonthIcon } from '@components/icons/calendar-month-icon'
import { ChevronLeftIcon } from '@components/icons/chevron-left-icon'
import { ChevronRightIcon } from '@components/icons/chevron-right-icon'
import { PaymentsIcon } from '@components/icons/payments-icon'
import { ScheduleIcon } from '@components/icons/schedule-icon'
import { listTenantAvailability } from '@src/lib/tenant-availability'
import { listTenantBookingsInRange } from '@src/lib/tenant-bookings'
import type { EnterpriseDashboardOutletContext } from '@src/pages/enterprise-dashboard/enterprise-dashboard.types'
import { AgendaBookingCard } from './agenda-booking-card/agenda-booking-card'
import type { AgendaStatusFilter } from './enterprise-agenda.types'
import {
  AGENDA_STATUS_FILTERS,
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  buildMonthGrid,
  collectBookingDateKeys,
  countActiveBookings,
  countAgendaByStatus,
  filterAgendaBookings,
  formatActiveRangeLabel,
  formatAgendaDateLabel,
  formatAgendaPrice,
  formatMonthYear,
  getWindowsForWeekday,
  resolveBookingsQueryRange,
  startOfDay,
  sumProjectedRevenue,
  toAgendaBookingCard,
  toDateKey,
} from './enterprise-agenda.utils'
import './enterprise-agenda.css'

export function EnterpriseAgenda() {
  const { tenant } = useOutletContext<EnterpriseDashboardOutletContext>()
  const [today] = useState(() => startOfDay(new Date()))
  const [now] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()))
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>('all')
  const [search, setSearch] = useState('')

  const { fromDate, toDate } = resolveBookingsQueryRange(viewMonth, selectedDate)
  const selectedKey = toDateKey(selectedDate)

  const bookingsQuery = useQuery({
    queryKey: ['tenant-bookings', tenant.id, fromDate, toDate],
    queryFn: () => listTenantBookingsInRange(tenant.id, fromDate, toDate),
  })

  const availabilityQuery = useQuery({
    queryKey: ['tenant-availability', tenant.id],
    queryFn: () => listTenantAvailability(tenant.id),
  })

  const monthBookings = bookingsQuery.data ?? []
  const bookingDateKeys = collectBookingDateKeys(monthBookings)

  const dayBookings = monthBookings
    .filter((booking) => booking.booking_date === selectedKey)
    .map((booking) => toAgendaBookingCard(booking, now))

  const filteredBookings = filterAgendaBookings(dayBookings, {
    statusFilter,
    search,
  })

  const statusCounts = countAgendaByStatus(dayBookings)
  const bookingCount = countActiveBookings(dayBookings)
  const projectedRevenue = sumProjectedRevenue(dayBookings)
  const projectedRevenueLabel =
    dayBookings.length === 0 ? '—' : formatAgendaPrice(projectedRevenue)

  const dayWindows = getWindowsForWeekday(availabilityQuery.data ?? [], selectedDate)
  const activeRangeLabel = formatActiveRangeLabel(dayWindows)

  const days = buildMonthGrid({
    viewMonth,
    selected: selectedDate,
    today,
    minDate: new Date(1970, 0, 1),
    availableKeys: null,
  })

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
                <span className="enterprise-agenda__stat-label">
                  {selectedKey === toDateKey(today) ? 'Citas hoy' : 'Citas'}
                </span>
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
              {days.map((day) => {
                const dayKey = toDateKey(day.date)
                const hasBookings = bookingDateKeys.has(dayKey)

                return (
                  <button
                    key={dayKey}
                    type="button"
                    className={classNames('enterprise-agenda__day', {
                      'enterprise-agenda__day--selected': day.isSelected,
                      'enterprise-agenda__day--today': day.isToday && !day.isSelected,
                      'enterprise-agenda__day--muted': !day.isCurrentMonth,
                      'enterprise-agenda__day--has-bookings': hasBookings && !day.isSelected,
                    })}
                    onClick={() => {
                      setSelectedDate(startOfDay(day.date))
                      if (!day.isCurrentMonth) {
                        setViewMonth(startOfDay(day.date))
                      }
                    }}
                  >
                    <span>{day.dayNumber}</span>
                    {hasBookings ? (
                      <span className="enterprise-agenda__day-dot" aria-hidden="true" />
                    ) : null}
                  </button>
                )
              })}
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
                    <span className="enterprise-agenda__filter-count">
                      {statusCounts[option.id]}
                    </span>
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
              Rango activo: <strong>{activeRangeLabel}</strong>
              <span aria-hidden="true"> · </span>
              Zona horaria: <strong>Madrid (CET)</strong>
            </p>
          </header>

          {bookingsQuery.isLoading ? (
            <div className="enterprise-agenda__empty">
              <p className="enterprise-agenda__empty-title">Cargando citas…</p>
            </div>
          ) : bookingsQuery.isError ? (
            <div className="enterprise-agenda__empty">
              <p className="enterprise-agenda__empty-title">No se pudieron cargar las citas</p>
              <p className="enterprise-agenda__empty-text">
                Revisa la conexión e inténtalo de nuevo.
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="enterprise-agenda__empty">
              <p className="enterprise-agenda__empty-title">No hay citas para este día</p>
              <p className="enterprise-agenda__empty-text">
                Cuando lleguen reservas desde tu página pública, aparecerán aquí en la línea
                temporal.
                {search.trim() || statusFilter !== 'all'
                  ? ' Prueba a limpiar la búsqueda o el filtro si esperabas resultados.'
                  : null}
              </p>
            </div>
          ) : (
            <ul className="enterprise-agenda__booking-list">
              {filteredBookings.map((booking) => (
                <li key={booking.id}>
                  <AgendaBookingCard booking={booking} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
