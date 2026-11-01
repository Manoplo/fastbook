/** Catálogo visible en la página pública de reserva. */
export function filterPublicServices<T extends { active: boolean }>(
  services: T[],
): T[] {
  return services.filter((service) => service.active)
}
