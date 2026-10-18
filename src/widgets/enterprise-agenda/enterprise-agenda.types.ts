export type AgendaStatusFilter =
  | 'all'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type AgendaStatusFilterOption = {
  id: AgendaStatusFilter
  label: string
  tone: 'all' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
}

/** Estado visual de la cita (derivado de BBDD + hora actual). */
export type AgendaBookingUiStatus =
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type AgendaBookingCardModel = {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  notes: string | null
  serviceName: string
  price: number
  dbStatus: string
  uiStatus: AgendaBookingUiStatus
  refLabel: string
}
