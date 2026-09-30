import { create } from 'zustand'

type BookingSelectionState = {
  /** Paso actual del flujo (1 = fecha/servicio, 2 = datos, 3 = confirmación) */
  step: 1 | 2 | 3
  /** Fecha seleccionada en formato YYYY-MM-DD */
  dateKey: string | null
  /** Hora de inicio HH:mm */
  startTime: string | null
  /** Servicio elegido */
  serviceId: string | null
  /** Comentarios opcionales */
  notes: string
  setStep: (step: 1 | 2 | 3) => void
  setDateKey: (dateKey: string | null) => void
  setStartTime: (startTime: string | null) => void
  setServiceId: (serviceId: string | null) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialState = {
  step: 1 as const,
  dateKey: null as string | null,
  startTime: null as string | null,
  serviceId: null as string | null,
  notes: '',
}

export const useBookingSelectionStore = create<BookingSelectionState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setDateKey: (dateKey) => set({ dateKey, startTime: null }),
  setStartTime: (startTime) => set({ startTime }),
  setServiceId: (serviceId) => set({ serviceId }),
  setNotes: (notes) => set({ notes }),
  reset: () => set(initialState),
}))
