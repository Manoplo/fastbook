import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { showErrorToast, showSuccessToast } from '@components/app-toaster/show-app-toast'
import {
  formatSummaryDate,
  formatSummaryTimeLabel,
} from '@components/booking-summary-card/booking-summary-card.utils'
import { Calendar } from '@components/calendar/calendar'
import { toDateKey, startOfDay } from '@components/calendar/calendar.utils'
import { TimeSlots } from '@components/time-slots/time-slots'
import { buildAvailableDates } from '@components/time-slots/time-slots.utils'
import { enterpriseDashboardPath } from '@src/lib/enterprise-dashboard-paths'
import { bookingAppointmentLabel } from '@src/lib/booking-label.utils'
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
import { isBookingIdParam } from '@src/lib/public-booking-manage.utils'
import {
  getTenantBookingById,
  updateTenantBooking,
} from '@src/lib/tenant-bookings'
import { resolveBookingRange } from '@src/lib/tenant-booking-window.utils'
import type { EnterpriseDashboardOutletContext } from '@src/pages/enterprise-dashboard/enterprise-dashboard.types'
import './enterprise-booking-detail.css'

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

export function EnterpriseBookingDetail() {
  const { bookingId = '' } = useParams<{ bookingId: string }>()
  const { tenant } = useOutletContext<EnterpriseDashboardOutletContext>()
  const queryClient = useQueryClient()
  const agendaPath = enterpriseDashboardPath(tenant.slug, 'agenda')

  const bookingQuery = useQuery({
    queryKey: ['tenant-booking', tenant.id, bookingId],
    queryFn: () => getTenantBookingById(tenant.id, bookingId),
    enabled: isBookingIdParam(bookingId),
  })

  const tenantPublicQuery = useQuery({
    queryKey: ['tenant', tenant.slug],
    queryFn: () => getTenantBySlug(tenant.slug),
    enabled: bookingQuery.isSuccess && Boolean(bookingQuery.data),
  })

  const booking = bookingQuery.data
  const publicTenant = tenantPublicQuery.data

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'cancelled'>('confirmed')
  const [dateKey, setDateKey] = useState('')
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    if (!booking) {
      return
    }
    setCustomerName(booking.customer_name)
    setCustomerEmail(booking.customer_email)
    setCustomerPhone(booking.customer_phone ?? '')
    setStatus(booking.status === 'cancelled' ? 'cancelled' : 'confirmed')
    setDateKey(booking.booking_date)
    setStartTime(normalizeTimeHhMm(booking.start_time))
  }, [booking])

  const windows = publicTenant ? getTenantAvailabilityWindows(publicTenant) : []
  const bookingRange = resolveBookingRange({
    today: startOfDay(new Date()),
    opensOn: tenant.bookingOpensOn,
    closesOn: tenant.bookingClosesOn,
  })
  const availableDates = buildAvailableDates({
    windows,
    from: bookingRange.from,
    to: bookingRange.to,
  })
  const fromDateKey = toDateKey(bookingRange.from)
  const toDateKeyValue = toDateKey(bookingRange.to)
  const durationMinutes =
    booking?.service?.duration_minutes ?? DEFAULT_SLOT_DURATION_MINUTES

  const { data: occupiedRows = [] } = useQuery({
    queryKey: [
      'occupied-slots',
      tenant.id,
      fromDateKey,
      toDateKeyValue,
      bookingId,
    ],
    queryFn: () =>
      listOccupiedBookingStarts({
        tenantId: tenant.id,
        fromDate: fromDateKey,
        toDate: toDateKeyValue,
        excludeBookingId: bookingId,
      }),
    enabled: Boolean(booking) && status === 'confirmed',
  })

  const occupiedStartTimes = dateKey
    ? occupiedStartsForDate(occupiedRows, dateKey)
    : []

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!booking) {
        return
      }
      await updateTenantBooking(booking.id, {
        customerName,
        customerEmail,
        customerPhone,
        status,
        bookingDate: dateKey,
        startTime,
        durationMinutes,
      })
    },
    onSuccess: async () => {
      showSuccessToast('Reserva actualizada')
      await queryClient.invalidateQueries({ queryKey: ['tenant-booking', tenant.id] })
      await queryClient.invalidateQueries({ queryKey: ['tenant-bookings', tenant.id] })
      await queryClient.invalidateQueries({ queryKey: ['occupied-slots', tenant.id] })
    },
    onError: (error) => {
      showErrorToast(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      )
    },
  })

  if (!isBookingIdParam(bookingId)) {
    return (
      <div className="enterprise-booking-detail enterprise-booking-detail--status">
        <p>Identificador de reserva no válido.</p>
        <Link to={agendaPath}>Volver a la agenda</Link>
      </div>
    )
  }

  if (bookingQuery.isPending || (booking && tenantPublicQuery.isPending)) {
    return (
      <div className="enterprise-booking-detail enterprise-booking-detail--status">
        <p>Cargando reserva…</p>
      </div>
    )
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="enterprise-booking-detail enterprise-booking-detail--status">
        <p>No encontramos esta reserva.</p>
        <Link to={agendaPath}>Volver a la agenda</Link>
      </div>
    )
  }

  if (tenantPublicQuery.isError || !publicTenant) {
    return (
      <div className="enterprise-booking-detail enterprise-booking-detail--status">
        <p>No se pudo cargar el horario del negocio.</p>
        <Link to={agendaPath}>Volver a la agenda</Link>
      </div>
    )
  }

  const appointmentLabel = bookingAppointmentLabel({
    serviceName: booking.service?.name,
    tenantName: tenant.name,
  })

  return (
    <div className="enterprise-booking-detail">
      <div className="enterprise-booking-detail__top">
        <Link className="enterprise-booking-detail__back" to={agendaPath}>
          ← Agenda
        </Link>
        <h1 className="enterprise-booking-detail__title">Detalle de la reserva</h1>
        <p className="enterprise-booking-detail__subtitle">
          {appointmentLabel} · {formatSummaryDate(booking.booking_date)} ·{' '}
          {formatSummaryTimeLabel(normalizeTimeHhMm(booking.start_time))}
        </p>
      </div>

      <section className="enterprise-booking-detail__panel">
        <h2 className="enterprise-booking-detail__panel-title">Cliente</h2>
        <label className="enterprise-booking-detail__field">
          <span>Nombre</span>
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </label>
        <label className="enterprise-booking-detail__field">
          <span>Email</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
          />
        </label>
        <label className="enterprise-booking-detail__field">
          <span>Teléfono</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
          />
        </label>
        <label className="enterprise-booking-detail__field">
          <span>Estado</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'confirmed' | 'cancelled')
            }
          >
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Anulada</option>
          </select>
        </label>
      </section>

      <section className="enterprise-booking-detail__panel">
        <h2 className="enterprise-booking-detail__panel-title">Fecha y hora</h2>
        <div className="enterprise-booking-detail__schedule">
          <Calendar
            value={dateKey ? parseDateKey(dateKey) : null}
            onChange={(date) => {
              setDateKey(date ? toDateKey(date) : booking.booking_date)
              setStartTime('')
            }}
            availableDates={availableDates}
            minDate={bookingRange.minDate}
            maxDate={bookingRange.maxDate}
          />
          <TimeSlots
            date={dateKey ? parseDateKey(dateKey) : null}
            value={startTime || null}
            onChange={(value) => setStartTime(value ?? '')}
            windows={windows}
            durationMinutes={durationMinutes}
            occupiedStartTimes={occupiedStartTimes}
            eyebrow=""
            title="Franja"
          />
        </div>
      </section>

      <button
        type="button"
        className="enterprise-booking-detail__save"
        disabled={
          saveMutation.isPending ||
          !customerName.trim() ||
          !customerEmail.trim() ||
          !dateKey ||
          !startTime
        }
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}
