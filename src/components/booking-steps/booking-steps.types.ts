export type BookingStepItem = {
  id: number
  label: string
}

export type BookingStepsProps = {
  steps?: BookingStepItem[]
  /** Paso activo (1-based). */
  currentStep?: number
}
