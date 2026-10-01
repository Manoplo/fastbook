import { useMutation, useQuery } from '@tanstack/react-query'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { BookingConfirmation } from '@components/booking-confirmation/booking-confirmation'
import { BookingContinueBar } from '@components/booking-continue-bar/booking-continue-bar'
import { BookingNotes } from '@components/booking-notes/booking-notes'
import { BookingSteps } from '@components/booking-steps/booking-steps'
import { BookingSummaryCard } from '@components/booking-summary-card/booking-summary-card'
import { Calendar } from '@components/calendar/calendar'
import { toDateKey, startOfDay } from '@components/calendar/calendar.utils'
import { CustomerDetailsForm } from '@components/customer-details-form/customer-details-form'
import {
  CUSTOMER_DETAILS_DEFAULT_VALUES,
  type CustomerDetailsFormValues,
} from '@components/customer-details-form/customer-details-form.types'
import { FastbookLogo } from '@components/fastbook-logo/fastbook-logo'
import { ServiceList } from '@components/service-list/service-list'
import { SiteFooter } from '@components/site-footer/site-footer'
import { TimeSlots } from '@components/time-slots/time-slots'
import { buildAvailableDates } from '@components/time-slots/time-slots.utils'
import {
  BookingConflictError,
  createBooking,
  formatCustomerPhone,
} from '@src/lib/create-booking'
import {
  collectAvailabilityWindows,
  getTenantBySlug,
  resolveSlotDurationMinutes,
} from '@src/lib/get-tenant-by-slug'
import { useBookingSelectionStore } from '@src/stores/booking-selection-store'
import './booking.css'

const CUSTOMER_FORM_ID = 'customer-details-form'

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

export function BookingPage() {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>()
  const {
    step,
    dateKey,
    startTime,
    serviceId,
    notes,
    setStep,
    setDateKey,
    setStartTime,
    setServiceId,
    setNotes,
    reset: resetSelection,
  } = useBookingSelectionStore(
    useShallow((state) => ({
      step: state.step,
      dateKey: state.dateKey,
      startTime: state.startTime,
      serviceId: state.serviceId,
      notes: state.notes,
      setStep: state.setStep,
      setDateKey: state.setDateKey,
      setStartTime: state.setStartTime,
      setServiceId: state.setServiceId,
      setNotes: state.setNotes,
      reset: state.reset,
    })),
  )

  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const customerForm = useForm<CustomerDetailsFormValues>({
    defaultValues: CUSTOMER_DETAILS_DEFAULT_VALUES,
    mode: 'onChange',
  })
  const { isValid: isCustomerFormValid } = customerForm.formState
  const { reset: resetCustomerForm, handleSubmit } = customerForm

  const { data, isPending, isError } = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => getTenantBySlug(tenantSlug),
    enabled: Boolean(tenantSlug),
  })

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
  })

  useEffect(() => {
    resetSelection()
    resetCustomerForm(CUSTOMER_DETAILS_DEFAULT_VALUES)
  }, [tenantSlug, resetSelection, resetCustomerForm])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [step])

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
  const selectedService = tenant.services.find((service) => service.id === serviceId)
  const selectionComplete = Boolean(dateKey && startTime && selectedService)
  const showContinueBar = step === 1 && selectionComplete
  const canConfirm =
    isCustomerFormValid &&
    Boolean(selectedService && dateKey && startTime) &&
    !createBookingMutation.isPending

  async function handleConfirmBooking(values: CustomerDetailsFormValues) {
    if (!selectedService || !dateKey || !startTime) {
      return
    }

    setSubmitError(null)

    try {
      await createBookingMutation.mutateAsync({
        tenantId: tenant.id,
        serviceId: selectedService.id,
        bookingDate: dateKey,
        startTime,
        durationMinutes: selectedService.duration_minutes,
        customerName: values.fullName,
        customerEmail: values.email,
        customerPhone: formatCustomerPhone(values.phoneCountryCode, values.phone),
        notes,
      })
      setConfirmedEmail(values.email.trim().toLowerCase())
      setStep(3)
    } catch (error) {
      if (error instanceof BookingConflictError) {
        setSubmitError(error.message)
        return
      }
      setSubmitError('No se pudo confirmar la reserva. Inténtalo de nuevo.')
    }
  }

  function handleNewBooking() {
    resetSelection()
    resetCustomerForm(CUSTOMER_DETAILS_DEFAULT_VALUES)
    setConfirmedEmail('')
    setSubmitError(null)
  }

  return (
    <div
      className={classNames('booking', {
        'booking--with-continue-bar': showContinueBar,
      })}
    >
      <header className="booking__header">
        <div className="booking__header-inner">
          <FastbookLogo />
        </div>
      </header>

      <main className="booking__main">
        <section className="booking__hero">
          <div className="booking__hero-text">
            {step === 1 ? (
              <>
                <h1 className="booking__title">Reserva tu cita en {tenant.name}</h1>
                {tenant.booking_note ? (
                  <p className="booking__subtitle">{tenant.booking_note}</p>
                ) : null}
              </>
            ) : step === 2 ? (
              <>
                <h1 className="booking__title">Tus datos de reserva</h1>
                <p className="booking__subtitle">
                  Introduce la información de contacto para confirmar tu cita y recibir el
                  recordatorio automático y código QR.
                </p>
              </>
            ) : (
              <>
                <h1 className="booking__title">Todo listo</h1>
                <p className="booking__subtitle">
                  Revisa el resumen de tu cita confirmada.
                </p>
              </>
            )}
          </div>
          <BookingSteps
            currentStep={step}
            onStepSelect={(stepId) => {
              if (step === 3) {
                return
              }
              if (stepId < step) {
                setStep(stepId as 1 | 2)
              }
            }}
          />
        </section>

        {step === 1 ? (
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
        ) : null}

        {step === 2 ? (
          <FormProvider {...customerForm}>
            <form
              id={CUSTOMER_FORM_ID}
              className="booking__body booking__body--step-2"
              onSubmit={handleSubmit(handleConfirmBooking)}
              noValidate
            >
              <CustomerDetailsForm tenantName={tenant.name} />
              {selectedService && dateKey && startTime ? (
                <BookingSummaryCard
                  serviceName={selectedService.name}
                  durationMinutes={selectedService.duration_minutes}
                  dateKey={dateKey}
                  startTime={startTime}
                  price={selectedService.price}
                  imageUrl={selectedService.image_url}
                  canConfirm={canConfirm}
                  isSubmitting={createBookingMutation.isPending}
                  submitError={submitError}
                  formId={CUSTOMER_FORM_ID}
                  onEdit={() => setStep(1)}
                />
              ) : null}
            </form>
          </FormProvider>
        ) : null}

        {step === 3 && selectedService && dateKey && startTime ? (
          <BookingConfirmation
            tenantName={tenant.name}
            serviceName={selectedService.name}
            dateKey={dateKey}
            startTime={startTime}
            customerEmail={confirmedEmail}
            onNewBooking={handleNewBooking}
          />
        ) : null}
      </main>

      <SiteFooter />

      {showContinueBar && selectedService && dateKey && startTime ? (
        <BookingContinueBar
          serviceName={selectedService.name}
          durationMinutes={selectedService.duration_minutes}
          dateKey={dateKey}
          startTime={startTime}
          price={selectedService.price}
          onContinue={() => setStep(2)}
        />
      ) : null}
    </div>
  )
}
