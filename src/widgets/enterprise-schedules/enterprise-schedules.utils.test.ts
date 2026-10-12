import { describe, expect, it } from 'vitest'
import {
  FREE_MAX_SERVICES,
  buildWeekDraftFromRows,
  canAddService,
  canUploadServiceImage,
  copyWeekdaysToAll,
  flattenWeekDraft,
  parseServiceFormValues,
  validateWeekDraft,
} from './enterprise-schedules.utils'

describe('canAddService', () => {
  it('permite siempre si es Pro', () => {
    expect(canAddService({ isPro: true, serviceCount: 10 })).toBe(true)
  })

  it('bloquea el 3.er servicio en plan free', () => {
    expect(canAddService({ isPro: false, serviceCount: FREE_MAX_SERVICES })).toBe(
      false,
    )
    expect(canAddService({ isPro: false, serviceCount: 1 })).toBe(true)
  })
})

describe('canUploadServiceImage', () => {
  it('solo Pro puede subir imagen', () => {
    expect(canUploadServiceImage(true)).toBe(true)
    expect(canUploadServiceImage(false)).toBe(false)
  })
})

describe('validateWeekDraft / flattenWeekDraft', () => {
  it('rechaza tramos con fin <= inicio', () => {
    const error = validateWeekDraft([
      {
        dayOfWeek: 1,
        open: true,
        slots: [
          { localId: 'a', startTime: '14:00', endTime: '10:00' },
        ],
      },
    ])
    expect(error).not.toBeNull()
  })

  it('rechaza solapes', () => {
    const error = validateWeekDraft([
      {
        dayOfWeek: 1,
        open: true,
        slots: [
          { localId: 'a', startTime: '09:00', endTime: '14:00' },
          { localId: 'b', startTime: '13:00', endTime: '18:00' },
        ],
      },
    ])
    expect(error?.message).toMatch(/solapados/i)
  })

  it('aplana solo días abiertos', () => {
    const rows = flattenWeekDraft([
      {
        dayOfWeek: 1,
        open: true,
        slots: [{ localId: 'a', startTime: '09:00', endTime: '14:00' }],
      },
      { dayOfWeek: 0, open: false, slots: [] },
    ])
    expect(rows).toEqual([
      { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
    ])
  })
})

describe('buildWeekDraftFromRows', () => {
  it('marca abierto solo días con filas', () => {
    const draft = buildWeekDraftFromRows([
      { day_of_week: 1, start_time: '09:00:00', end_time: '14:00:00' },
      { day_of_week: 1, start_time: '16:00:00', end_time: '20:00:00' },
    ])
    const monday = draft.find((day) => day.dayOfWeek === 1)
    const sunday = draft.find((day) => day.dayOfWeek === 0)
    expect(monday?.open).toBe(true)
    expect(monday?.slots).toHaveLength(2)
    expect(sunday?.open).toBe(false)
  })
})

describe('copyWeekdaysToAll', () => {
  it('abre L–V con los tramos del primer día laboral abierto', () => {
    const result = copyWeekdaysToAll([
      {
        dayOfWeek: 1,
        open: true,
        slots: [{ localId: 'a', startTime: '10:00', endTime: '13:00' }],
      },
      { dayOfWeek: 2, open: false, slots: [] },
      { dayOfWeek: 3, open: false, slots: [] },
      { dayOfWeek: 4, open: false, slots: [] },
      { dayOfWeek: 5, open: false, slots: [] },
      { dayOfWeek: 6, open: false, slots: [] },
      { dayOfWeek: 0, open: false, slots: [] },
    ])

    expect(result.filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5).every((d) => d.open)).toBe(
      true,
    )
    expect(result.find((d) => d.dayOfWeek === 2)?.slots[0]?.startTime).toBe('10:00')
  })
})

describe('parseServiceFormValues', () => {
  it('parsea precio con coma', () => {
    expect(
      parseServiceFormValues({
        name: 'Corte',
        durationMinutes: '30',
        price: '25,50',
        description: '',
        active: true,
      }),
    ).toEqual({
      name: 'Corte',
      durationMinutes: 30,
      price: 25.5,
      description: null,
      active: true,
    })
  })

  it('rechaza nombre vacío', () => {
    expect(
      parseServiceFormValues({
        name: '  ',
        durationMinutes: '30',
        price: '10',
        description: '',
        active: true,
      }),
    ).toBeNull()
  })
})
