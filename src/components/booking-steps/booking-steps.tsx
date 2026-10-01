import classNames from "classnames";
import { ArrowBackIcon } from "@components/icons/arrow-back-icon";
import { DEFAULT_BOOKING_STEPS } from "./booking-steps.constants";
import type { BookingStepsProps } from "./booking-steps.types";
import "./booking-steps.css";

export function BookingSteps({ steps = DEFAULT_BOOKING_STEPS, currentStep = 1, onStepSelect }: BookingStepsProps) {
  const canGoBack = currentStep === 2;

  return (
    <div className="booking-steps-wrap">
      {canGoBack ? (
        <button type="button" className="booking-steps__back" onClick={() => onStepSelect?.(currentStep - 1)}>
          <ArrowBackIcon className="booking-steps__back-icon" />
          <span>Volver al paso anterior</span>
        </button>
      ) : null}

      <nav className="booking-steps" aria-label="Progreso de la reserva">
        <ol className="booking-steps__list">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isComplete = step.id < currentStep;
            const isClickable = isComplete && Boolean(onStepSelect);

            const className = classNames("booking-steps__step", {
              "booking-steps__step--current": isCurrent,
              "booking-steps__step--complete": isComplete,
              "booking-steps__step--clickable": isClickable,
            });

            const content = (
              <>
                <span className="booking-steps__number">{step.id}</span>
                <span className="booking-steps__label">{step.label}</span>
              </>
            );

            return (
              <li key={step.id} className="booking-steps__item">
                {index > 0 ? (
                  <span className="booking-steps__separator" aria-hidden="true">
                    ›
                  </span>
                ) : null}

                {isClickable ? (
                  <button
                    type="button"
                    className={className}
                    onClick={() => onStepSelect?.(step.id)}
                    aria-label={`Volver a ${step.label}`}
                  >
                    {content}
                  </button>
                ) : (
                  <span className={className} aria-current={isCurrent ? "step" : undefined}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
