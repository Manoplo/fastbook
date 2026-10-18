import type {
  DayScheduleDraft,
  ScheduleSlotDraft,
  ServiceFormValues,
} from './enterprise-schedules.types'

export const FREE_MAX_SERVICES = 2

/** Orden de visualización Lun→Dom (day_of_week JS: 0=Dom … 6=Sáb). */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const WEEK_DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}

const DEFAULT_SLOT: Pick<ScheduleSlotDraft, 'startTime' | 'endTime'> = {
  startTime: '09:00',
  endTime: '14:00',
}

let localIdCounter = 0

export function createLocalId(prefix = 'slot'): string {
  localIdCounter += 1
  return `${prefix}-${localIdCounter}`
}

export function normalizeTimeHhMm(time: string): string {
  const [hours = '00', minutes = '00'] = time.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = normalizeTimeHhMm(time).split(':').map(Number)
  return hours * 60 + minutes
}

export function canAddService(options: {
  isPro: boolean
  serviceCount: number
}): boolean {
  if (options.isPro) {
    return true
  }
  return options.serviceCount < FREE_MAX_SERVICES
}

export function canUploadServiceImage(isPro: boolean): boolean {
  return isPro
}

export function periodLabelForSlot(startTime: string): string {
  return timeToMinutes(startTime) < 14 * 60 ? 'Mañana' : 'Tarde'
}

export function formatSlotRange(startTime: string, endTime: string): string {
  return `${normalizeTimeHhMm(startTime)} — ${normalizeTimeHhMm(endTime)}`
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
}

export function buildWeekDraftFromRows(
  rows: AvailabilityRow[],
): DayScheduleDraft[] {
  return WEEK_DAY_ORDER.map((dayOfWeek) => {
    const dayRows = rows
      .filter((row) => row.day_of_week === dayOfWeek)
      .sort(
        (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
      )

    return {
      dayOfWeek,
      open: dayRows.length > 0,
      slots: dayRows.map((row) => ({
        localId: createLocalId(),
        startTime: normalizeTimeHhMm(row.start_time),
        endTime: normalizeTimeHhMm(row.end_time),
      })),
    }
  })
}

export function createEmptyWeekDraft(): DayScheduleDraft[] {
  return WEEK_DAY_ORDER.map((dayOfWeek) => ({
    dayOfWeek,
    open: false,
    slots: [],
  }))
}

export function createDefaultSlot(): ScheduleSlotDraft {
  return {
    localId: createLocalId(),
    ...DEFAULT_SLOT,
  }
}

export type SlotValidationError = {
  dayOfWeek: number
  message: string
}

export function validateWeekDraft(
  days: DayScheduleDraft[],
): SlotValidationError | null {
  for (const day of days) {
    if (!day.open) {
      continue
    }

    if (day.slots.length === 0) {
      return {
        dayOfWeek: day.dayOfWeek,
        message: `${WEEK_DAY_LABELS[day.dayOfWeek]} está abierto pero sin tramos.`,
      }
    }

    const sorted = [...day.slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    )

    for (let index = 0; index < sorted.length; index++) {
      const slot = sorted[index]
      const start = timeToMinutes(slot.startTime)
      const end = timeToMinutes(slot.endTime)

      if (end <= start) {
        return {
          dayOfWeek: day.dayOfWeek,
          message: `${WEEK_DAY_LABELS[day.dayOfWeek]}: la hora de fin debe ser posterior al inicio.`,
        }
      }

      if (index > 0) {
        const prev = sorted[index - 1]
        if (start < timeToMinutes(prev.endTime)) {
          return {
            dayOfWeek: day.dayOfWeek,
            message: `${WEEK_DAY_LABELS[day.dayOfWeek]}: hay tramos solapados.`,
          }
        }
      }
    }
  }

  return null
}

export function flattenWeekDraft(
  days: DayScheduleDraft[],
): Array<{ dayOfWeek: number; startTime: string; endTime: string }> {
  return days.flatMap((day) => {
    if (!day.open) {
      return []
    }
    return day.slots.map((slot) => ({
      dayOfWeek: day.dayOfWeek,
      startTime: normalizeTimeHhMm(slot.startTime),
      endTime: normalizeTimeHhMm(slot.endTime),
    }))
  })
}

/** Abre L–V con los tramos del primer día laboral abierto (o un tramo por defecto). */
export function copyWeekdaysToAll(days: DayScheduleDraft[]): DayScheduleDraft[] {
  const source =
    days.find((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && day.open) ?? null

  const slotsTemplate = source
    ? source.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
    : [{ startTime: '09:00', endTime: '14:00' }]

  return days.map((day) => {
    if (day.dayOfWeek < 1 || day.dayOfWeek > 5) {
      return day
    }
    return {
      ...day,
      open: true,
      slots: slotsTemplate.map((slot) => ({
        localId: createLocalId(),
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    }
  })
}

export function parseServiceFormValues(values: ServiceFormValues): {
  name: string
  durationMinutes: number
  price: number
  description: string | null
  active: boolean
} | null {
  const name = values.name.trim()
  const durationMinutes = Number(values.durationMinutes)
  const price = Number(values.price.replace(',', '.'))

  if (!name || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null
  }
  if (!Number.isFinite(price) || price < 0) {
    return null
  }

  return {
    name,
    durationMinutes: Math.round(durationMinutes),
    price,
    description: values.description.trim() || null,
    active: values.active,
  }
}

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  name: '',
  durationMinutes: '30',
  price: '',
  description: '',
  active: true,
}

export function serviceToFormValues(service: {
  name: string
  duration_minutes: number
  price: number
  description: string | null
  active: boolean
}): ServiceFormValues {
  return {
    name: service.name,
    durationMinutes: String(service.duration_minutes),
    price: String(service.price),
    description: service.description ?? '',
    active: service.active,
  }
}

export function formatPriceEuro(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}
