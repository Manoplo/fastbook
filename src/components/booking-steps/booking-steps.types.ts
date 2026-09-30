export type BookingStepItem = {
  id: number
  label: string
}

export type BookingStepsProps = {
  steps?: BookingStepItem[]
  /** Paso activo (1-based). */
  currentStep?: number
  /** Se dispara al clicar un paso ya completado o el enlace de volver. */
  onStepSelect?: (stepId: number) => void
}
