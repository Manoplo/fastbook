import { create } from 'zustand'
import type {
  CustomerDetailsFormValues,
  PhoneCountryCode,
} from '../components/customer-details-form/customer-details-form.types'

type BookingSelectionState = {
  /** Paso actual del flujo (1 = fecha/servicio, 2 = datos) */
  step: 1 | 2
  /** Fecha seleccionada en formato YYYY-MM-DD */
  dateKey: string | null
  /** Hora de inicio HH:mm */
  startTime: string | null
  /** Servicio elegido */
  serviceId: string | null
  /** Comentarios opcionales */
  notes: string
  fullName: string
  email: string
  phoneCountryCode: PhoneCountryCode
  phone: string
  privacyAccepted: boolean
  smsReminders: boolean
  setStep: (step: 1 | 2) => void
  setDateKey: (dateKey: string | null) => void
  setStartTime: (startTime: string | null) => void
  setServiceId: (serviceId: string | null) => void
  setNotes: (notes: string) => void
  patchCustomerDetails: (patch: Partial<CustomerDetailsFormValues>) => void
  reset: () => void
}

const initialState = {
  step: 1 as const,
  dateKey: null as string | null,
  startTime: null as string | null,
  serviceId: null as string | null,
  notes: '',
  fullName: '',
  email: '',
  phoneCountryCode: '+34' as PhoneCountryCode,
  phone: '',
  privacyAccepted: false,
  smsReminders: false,
}

export const useBookingSelectionStore = create<BookingSelectionState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setDateKey: (dateKey) => set({ dateKey, startTime: null }),
  setStartTime: (startTime) => set({ startTime }),
  setServiceId: (serviceId) => set({ serviceId }),
  setNotes: (notes) => set({ notes }),
  patchCustomerDetails: (patch) => set(patch),
  reset: () => set(initialState),
}))
