import { describe, expect, it } from 'vitest'
import { bookingAppointmentLabel } from './booking-label.utils'

describe('bookingAppointmentLabel', () => {
  it('usa el nombre del servicio cuando existe', () => {
    expect(
      bookingAppointmentLabel({
        serviceName: 'Corte clásico',
        tenantName: 'Barbería Norte',
      }),
    ).toBe('Corte clásico')
  })

  it('cae a «Cita con {tenant}» sin servicio', () => {
    expect(
      bookingAppointmentLabel({
        serviceName: null,
        tenantName: 'Barbería Norte',
      }),
    ).toBe('Cita con Barbería Norte')
  })

  it('trata nombres vacíos como sin servicio', () => {
    expect(
      bookingAppointmentLabel({
        serviceName: '   ',
        tenantName: 'Clínica Sol',
      }),
    ).toBe('Cita con Clínica Sol')
  })
})
