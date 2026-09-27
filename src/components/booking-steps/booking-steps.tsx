import { DEFAULT_BOOKING_STEPS } from './booking-steps.constants'
import type { BookingStepsProps } from './booking-steps.types'
import './booking-steps.css'

export function BookingSteps({
  steps = DEFAULT_BOOKING_STEPS,
  currentStep = 1,
}: BookingStepsProps) {
  return (
    <nav
      className="booking-steps"
      aria-label="Progreso de la reserva"
    >
      <ol className="booking-steps__list">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isComplete = step.id < currentStep

          return (
            <li key={step.id} className="booking-steps__item">
              {index > 0 ? (
                <span className="booking-steps__separator" aria-hidden="true">
                  ›
                </span>
              ) : null}

              <span
                className={[
                  'booking-steps__step',
                  isCurrent ? 'booking-steps__step--current' : '',
                  isComplete ? 'booking-steps__step--complete' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="booking-steps__number">{step.id}</span>
                <span className="booking-steps__label">{step.label}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
