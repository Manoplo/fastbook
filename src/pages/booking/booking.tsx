import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { BookingNotes } from '../../components/booking-notes/booking-notes'
import { BookingSteps } from '../../components/booking-steps/booking-steps'
import { Calendar } from '../../components/calendar/calendar'
import { toDateKey, startOfDay } from '../../components/calendar/calendar.utils'
import { FastbookLogo } from '../../components/fastbook-logo/fastbook-logo'
import { ServiceList } from '../../components/service-list/service-list'
import { SiteFooter } from '../../components/site-footer/site-footer'
import { TimeSlots } from '../../components/time-slots/time-slots'
import { buildAvailableDates } from '../../components/time-slots/time-slots.utils'
import {
  collectAvailabilityWindows,
  getTenantBySlug,
  resolveSlotDurationMinutes,
} from '../../lib/get-tenant-by-slug'
import { useBookingSelectionStore } from '../../stores/booking-selection-store'
import './booking.css'

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

export function BookingPage() {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>()
  const {
    dateKey,
    startTime,
    serviceId,
    notes,
    setDateKey,
    setStartTime,
    setServiceId,
    setNotes,
    reset: resetSelection,
  } = useBookingSelectionStore(
    useShallow((state) => ({
      dateKey: state.dateKey,
      startTime: state.startTime,
      serviceId: state.serviceId,
      notes: state.notes,
      setDateKey: state.setDateKey,
      setStartTime: state.setStartTime,
      setServiceId: state.setServiceId,
      setNotes: state.setNotes,
      reset: state.reset,
    })),
  )

  const { data, isPending, isError } = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => getTenantBySlug(tenantSlug),
    enabled: Boolean(tenantSlug),
  })

  useEffect(() => {
    resetSelection()
  }, [tenantSlug, resetSelection])

  if (isPending) {
    return (
      <div className="booking">
        <header className="booking__header">
          <div className="booking__header-inner">
            <FastbookLogo />
          </div>
        </header>
        <main className="booking__main">
          <p className="booking__status">Cargando…</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="booking">
        <header className="booking__header">
          <div className="booking__header-inner">
            <FastbookLogo />
          </div>
        </header>
        <main className="booking__main">
          <p className="booking__status booking__status--error">
            No se pudo cargar el negocio. Inténtalo de nuevo.
          </p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="booking">
        <header className="booking__header">
          <div className="booking__header-inner">
            <FastbookLogo />
          </div>
        </header>
        <main className="booking__main">
          <p className="booking__status booking__status--error">
            No encontramos un negocio con el enlace “{tenantSlug}”.
          </p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const tenant = data
  const windows = collectAvailabilityWindows(tenant.services)
  const durationMinutes = resolveSlotDurationMinutes(tenant.services)
  const availableDates = buildAvailableDates({
    windows,
    from: startOfDay(new Date()),
  })
  const selectedDate = dateKey ? parseDateKey(dateKey) : null

  return (
    <div className="booking">
      <header className="booking__header">
        <div className="booking__header-inner">
          <FastbookLogo />
        </div>
      </header>

      <main className="booking__main">
        <section className="booking__hero">
          <div className="booking__hero-text">
            <h1 className="booking__title">Reserva tu cita en {tenant.name}</h1>
            {tenant.booking_note ? (
              <p className="booking__subtitle">{tenant.booking_note}</p>
            ) : null}
          </div>
          <BookingSteps currentStep={1} />
        </section>

        <div className="booking__body">
          <section
            className="booking__schedule"
            aria-label="Fecha y franja horaria"
          >
            <Calendar
              value={selectedDate}
              onChange={(date) => setDateKey(date ? toDateKey(date) : null)}
              availableDates={availableDates}
            />
            <TimeSlots
              date={selectedDate}
              value={startTime}
              onChange={setStartTime}
              windows={windows}
              durationMinutes={durationMinutes}
            />
          </section>

          <section
            className="booking__services-column"
            aria-label="Servicios y comentarios"
          >
            <ServiceList
              services={tenant.services}
              value={serviceId}
              onChange={setServiceId}
            />
            <BookingNotes value={notes} onChange={setNotes} />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
