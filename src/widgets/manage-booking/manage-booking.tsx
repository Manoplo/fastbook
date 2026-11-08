import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { showErrorToast, showSuccessToast } from '@components/app-toaster/show-app-toast'
import {
  formatSummaryDate,
  formatSummaryTimeLabel,
} from '@components/booking-summary-card/booking-summary-card.utils'
import { Calendar } from '@components/calendar/calendar'
import { toDateKey, startOfDay } from '@components/calendar/calendar.utils'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { SiteFooter } from '@components/site-footer/site-footer'
import { TimeSlots } from '@components/time-slots/time-slots'
import { buildAvailableDates } from '@components/time-slots/time-slots.utils'
import { bookingAppointmentLabel } from '@src/lib/booking-label.utils'
import { addMinutesToTime } from '@src/lib/create-booking.utils'
import {
  DEFAULT_SLOT_DURATION_MINUTES,
  getTenantAvailabilityWindows,
  getTenantBySlug,
} from '@src/lib/get-tenant-by-slug'
import {
  listOccupiedBookingStarts,
  occupiedStartsForDate,
} from '@src/lib/occupied-booking-slots'
import { normalizeTimeHhMm } from '@src/lib/occupied-booking-slots.utils'
import {
  cancelPublicBooking,
  getPublicBooking,
  PublicBookingManageError,
  reschedulePublicBooking,
  updatePublicBookingContact,
  type PublicBookingRecord,
} from '@src/lib/public-booking-manage'
import { isBookingIdParam } from '@src/lib/public-booking-manage.utils'
import { resolveBookingRange } from '@src/lib/tenant-booking-window.utils'
import type { ManageBookingContentProps } from './manage-booking.types'
import './manage-booking.css'

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

function ManageBookingContent({
  booking,
  tenant,
  onBookingChange,
}: ManageBookingContentProps) {
  const queryClient = useQueryClient()
  const isCancelled = booking.status === 'cancelled'
  const durationMinutes =
    booking.service_duration_minutes ?? DEFAULT_SLOT_DURATION_MINUTES
  const appointmentLabel = bookingAppointmentLabel({
    serviceName: booking.service_name,
    tenantName: tenant.name,
  })

  const [email, setEmail] = useState(booking.customer_email)
  const [phone, setPhone] = useState(booking.customer_phone ?? '')
  const [dateKey, setDateKey] = useState(booking.booking_date)
  const [startTime, setStartTime] = useState(normalizeTimeHhMm(booking.start_time))

  const windows = getTenantAvailabilityWindows(tenant)
  const bookingRange = resolveBookingRange({
    today: startOfDay(new Date()),
    opensOn: tenant.booking_opens_on,
    closesOn: tenant.booking_closes_on,
  })
  const availableDates = buildAvailableDates({
    windows,
    from: bookingRange.from,
    to: bookingRange.to,
  })
  const fromDateKey = toDateKey(bookingRange.from)
  const toDateKeyValue = toDateKey(bookingRange.to)

  const { data: occupiedRows = [] } = useQuery({
    queryKey: [
      'occupied-slots',
      tenant.id,
      fromDateKey,
      toDateKeyValue,
      booking.id,
    ],
    queryFn: () =>
      listOccupiedBookingStarts({
        tenantId: tenant.id,
        fromDate: fromDateKey,
        toDate: toDateKeyValue,
        excludeBookingId: booking.id,
      }),
    enabled: !isCancelled,
  })

  const occupiedStartTimes = occupiedStartsForDate(occupiedRows, dateKey)
  const selectedDate = dateKey ? parseDateKey(dateKey) : null

  function handleBookingUpdated(next: PublicBookingRecord) {
    onBookingChange(next)
    setEmail(next.customer_email)
    setPhone(next.customer_phone ?? '')
    setDateKey(next.booking_date)
    setStartTime(normalizeTimeHhMm(next.start_time))
    void queryClient.invalidateQueries({ queryKey: ['occupied-slots', tenant.id] })
  }

  const contactMutation = useMutation({
    mutationFn: () =>
      updatePublicBookingContact({
        tenantSlug: tenant.slug,
        bookingId: booking.id,
        customerEmail: email,
        customerPhone: phone,
      }),
    onSuccess: (next) => {
      handleBookingUpdated(next)
      showSuccessToast('Contacto actualizado')
    },
    onError: (error) => {
      showErrorToast(
        'No se pudo guardar',
        error instanceof PublicBookingManageError
          ? error.message
          : 'Inténtalo de nuevo.',
      )
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      reschedulePublicBooking({
        tenantSlug: tenant.slug,
        bookingId: booking.id,
        bookingDate: dateKey,
        startTime,
        endTime: addMinutesToTime(startTime, durationMinutes),
      }),
    onSuccess: (next) => {
      handleBookingUpdated(next)
      showSuccessToast('Cita reprogramada')
    },
    onError: (error) => {
      showErrorToast(
        'No se pudo reprogramar',
        error instanceof PublicBookingManageError
          ? error.message
          : 'Inténtalo de nuevo.',
      )
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelPublicBooking(tenant.slug, booking.id),
    onSuccess: (next) => {
      handleBookingUpdated(next)
      showSuccessToast('Cita anulada')
    },
    onError: (error) => {
      showErrorToast(
        'No se pudo anular',
        error instanceof PublicBookingManageError
          ? error.message
          : 'Inténtalo de nuevo.',
      )
    },
  })

  return (
    <div className="manage-booking">
      <header className="manage-booking__header">
        <div className="manage-booking__header-inner">
          <FastbookLogo />
        </div>
      </header>

      <main className="manage-booking__main">
        <section className="manage-booking__hero">
          <p className="manage-booking__eyebrow">{tenant.name}</p>
          <h1 className="manage-booking__title">Tu reserva</h1>
          <p className="manage-booking__subtitle">
            {isCancelled
              ? 'Esta cita está anulada. Si necesitas una nueva, vuelve a la página de reservas.'
              : 'Puedes cambiar el contacto, reprogramar la hora o anular la cita.'}
          </p>
        </section>

        <section className="manage-booking__summary" aria-label="Resumen">
          <div className="manage-booking__summary-row">
            <span>Estado</span>
            <strong>{isCancelled ? 'Anulada' : 'Confirmada'}</strong>
          </div>
          <div className="manage-booking__summary-row">
            <span>Cita</span>
            <strong>{appointmentLabel}</strong>
          </div>
          <div className="manage-booking__summary-row">
            <span>Fecha</span>
            <strong>{formatSummaryDate(booking.booking_date)}</strong>
          </div>
          <div className="manage-booking__summary-row">
            <span>Hora</span>
            <strong>
              {formatSummaryTimeLabel(normalizeTimeHhMm(booking.start_time))}
            </strong>
          </div>
          <div className="manage-booking__summary-row">
            <span>Nombre</span>
            <strong>{booking.customer_name}</strong>
          </div>
        </section>

        {!isCancelled ? (
          <>
            <section className="manage-booking__panel" aria-label="Contacto">
              <h2 className="manage-booking__panel-title">Contacto</h2>
              <label className="manage-booking__field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="manage-booking__field">
                <span>Teléfono</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <button
                type="button"
                className="manage-booking__button"
                disabled={contactMutation.isPending}
                onClick={() => contactMutation.mutate()}
              >
                {contactMutation.isPending ? 'Guardando…' : 'Guardar contacto'}
              </button>
            </section>

            <section className="manage-booking__panel" aria-label="Reprogramar">
              <h2 className="manage-booking__panel-title">Reprogramar</h2>
              <div className="manage-booking__schedule">
                <Calendar
                  value={selectedDate}
                  onChange={(date) => {
                    setDateKey(date ? toDateKey(date) : booking.booking_date)
                    setStartTime('')
                  }}
                  availableDates={availableDates}
                  minDate={bookingRange.minDate}
                  maxDate={bookingRange.maxDate}
                />
                <TimeSlots
                  date={selectedDate}
                  value={startTime || null}
                  onChange={(value) => setStartTime(value ?? '')}
                  windows={windows}
                  durationMinutes={durationMinutes}
                  occupiedStartTimes={occupiedStartTimes}
                  eyebrow=""
                  title="Nueva franja"
                />
              </div>
              <button
                type="button"
                className="manage-booking__button"
                disabled={!dateKey || !startTime || rescheduleMutation.isPending}
                onClick={() => rescheduleMutation.mutate()}
              >
                {rescheduleMutation.isPending ? 'Reprogramando…' : 'Guardar nueva hora'}
              </button>
            </section>

            <section className="manage-booking__panel manage-booking__panel--danger">
              <h2 className="manage-booking__panel-title">Anular cita</h2>
              <p className="manage-booking__hint">
                La franja quedará libre para otras reservas.
              </p>
              <button
                type="button"
                className="manage-booking__button manage-booking__button--danger"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      '¿Seguro que quieres anular esta cita? Esta acción no se puede deshacer.',
                    )
                  ) {
                    cancelMutation.mutate()
                  }
                }}
              >
                {cancelMutation.isPending ? 'Anulando…' : 'Anular reserva'}
              </button>
            </section>
          </>
        ) : (
          <p className="manage-booking__hint">
            <Link to={`/${tenant.slug}`}>Reservar de nuevo en {tenant.name}</Link>
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export function ManageBooking() {
  const queryClient = useQueryClient()
  const { tenantSlug = '', bookingId = '' } = useParams<{
    tenantSlug: string
    bookingId: string
  }>()
  const bookingQueryKey = ['public-booking', tenantSlug, bookingId] as const

  const bookingQuery = useQuery({
    queryKey: bookingQueryKey,
    queryFn: () => getPublicBooking(tenantSlug, bookingId),
    enabled: Boolean(tenantSlug) && isBookingIdParam(bookingId),
    retry: false,
  })

  const tenantQuery = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => getTenantBySlug(tenantSlug),
    enabled: Boolean(tenantSlug) && bookingQuery.isSuccess,
  })

  if (!isBookingIdParam(bookingId)) {
    return (
      <div className="manage-booking manage-booking--status">
        <p>El enlace de la reserva no es válido.</p>
        <Link to="/">Volver</Link>
      </div>
    )
  }

  if (bookingQuery.isPending || (bookingQuery.isSuccess && tenantQuery.isPending)) {
    return (
      <div className="manage-booking manage-booking--status">
        <p>Cargando reserva…</p>
      </div>
    )
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="manage-booking manage-booking--status">
        <p>
          {bookingQuery.error instanceof PublicBookingManageError
            ? bookingQuery.error.message
            : 'No encontramos esta reserva.'}
        </p>
        {tenantSlug ? (
          <Link to={`/${tenantSlug}`}>Ir a la página de reservas</Link>
        ) : null}
      </div>
    )
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <div className="manage-booking manage-booking--status">
        <p>No se pudo cargar el negocio.</p>
      </div>
    )
  }

  return (
    <ManageBookingContent
      booking={bookingQuery.data}
      tenant={tenantQuery.data}
      onBookingChange={(next) => {
        queryClient.setQueryData(bookingQueryKey, next)
      }}
    />
  )
}
