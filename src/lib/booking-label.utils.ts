/** Etiqueta pública de una reserva: servicio del catálogo o cita genérica. */
export function bookingAppointmentLabel(options: {
  serviceName?: string | null
  tenantName: string
}): string {
  const serviceName = options.serviceName?.trim()
  if (serviceName) {
    return serviceName
  }
  return `Cita con ${options.tenantName}`
}
