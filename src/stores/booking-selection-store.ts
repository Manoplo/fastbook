import { create } from 'zustand'

type BookingSelectionState = {
  /** Fecha seleccionada en formato YYYY-MM-DD */
  dateKey: string | null
  /** Hora de inicio HH:mm */
  startTime: string | null
  /** Servicio elegido (paso 3) */
  serviceId: string | null
  /** Comentarios opcionales (sección 4) */
  notes: string
  setDateKey: (dateKey: string | null) => void
  setStartTime: (startTime: string | null) => void
  setServiceId: (serviceId: string | null) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialState = {
  dateKey: null as string | null,
  startTime: null as string | null,
  serviceId: null as string | null,
  notes: '',
}

export const useBookingSelectionStore = create<BookingSelectionState>((set) => ({
  ...initialState,
  setDateKey: (dateKey) => set({ dateKey, startTime: null }),
  setStartTime: (startTime) => set({ startTime }),
  setServiceId: (serviceId) => set({ serviceId }),
  setNotes: (notes) => set({ notes }),
  reset: () => set(initialState),
}))
