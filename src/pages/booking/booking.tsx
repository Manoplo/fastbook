import { useState } from 'react'
import { Calendar } from '../../components/calendar/calendar'
import { FastbookLogo } from '../../components/fastbook-logo/fastbook-logo'
import './booking.css'

const TENANT_SUBTITLE_PLACEHOLDER =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <div className="booking">
      <header className="booking__header">
        <div className="booking__header-inner">
          <FastbookLogo />
        </div>
      </header>

      <main className="booking__main">
        <section className="booking__hero">
          <h1 className="booking__title">Reserva tu cita en pocos pasos</h1>
          <p className="booking__subtitle">{TENANT_SUBTITLE_PLACEHOLDER}</p>
        </section>

        <section className="booking__calendar-section">
          <Calendar value={selectedDate} onChange={setSelectedDate} />
        </section>
      </main>
    </div>
  )
}
