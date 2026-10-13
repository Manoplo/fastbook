# Handoff — Fastbook (sesión hasta 2026-10-12)

Documento para el siguiente agente tras limpiar contexto. Leer también `.cursor/rules/fastbook.mdc` y `fastbook-roadmap.md`.

## Estado actual

- **Rama:** `feat/dashboard-bookings`
- **App:** React 19 + Vite 8 + TypeScript + **React Compiler** activo
- **MCPs listos:** Supabase (`user-supabase`) y Stitch (`user-stitch`)
- **CI:** `pnpm verify` (lint + tests) en cada push
- **BBDD:** free tier + `tenant_auth` + `tenant_availability_and_pro` (`is_pro`, horario a nivel tenant)
- **Reserva pública:** operativa; slots desde `tenant_availability`
- **Auth empresa:** login/signup + dashboard autenticado operativos
- **Horarios y Servicios:** UI + CRUD operativos en `/enterprise/:tenantSlug/schedules`
- **Agenda y Citas:** UI Stitch + **bookings reales** del tenant (timeline, contadores, filtros, búsqueda)

## Qué hay hecho (resumen)

1. Bootstrap + CI + tokens + logo.
2. Flujo público de reserva completo.
3. Auth enterprise (Supabase email/password, `owner_id`, RLS owner, check-email).
4. Dashboard shell (header + floating nav + rutas anidadas).
5. **Agenda:** cards Stitch + datos reales (`listTenantBookingsInRange` + join `services`).
6. **Horarios y Servicios:** editor semanal + catálogo + modal PRO (límite 2 servicios / sin imagen).

## Stitch

- Proyecto: **Mobile QR Booking System** (`projects/4608395597619626930`)
- Agenda: **Agenda y Citas** — `screens/4bbda819ea6e4f0e84a9052102a10fe3`
- Horarios y Servicios: `screens/344caed640c9428b92f49a76ea41d055` (upsell free → modal única, no chips/cards)
- Login empresas: `screens/d66b74e188954958885d664b3626d472`
- Tokens: primary `#1c2ac8` / logo `#3B49DF`, Plus Jakarta Sans, surface `#f8f9ff`

## Arquitectura FE relevante

```
src/
  pages/enterprise-dashboard/   → layout autenticado + Outlet (badge según is_pro)
  pages/enterprise-agenda/      → monta widget
  pages/enterprise-schedules/   → monta widget
  widgets/enterprise-agenda/    → timeline + filtros + cards
    agenda-booking-card/        → card Stitch por cita
  widgets/enterprise-schedules/ → horario + catálogo + upgrade-pro-modal
  lib/tenant-bookings.ts        → listado bookings con servicio
  lib/tenant-availability.ts
  lib/tenant-services.ts
```

## Rutas enterprise

| Ruta | Estado |
|---|---|
| `/enterprise/login` | Hecho |
| `/enterprise/check-email` | Hecho |
| `/enterprise/:tenantSlug` → redirect `/agenda` | Hecho |
| `/enterprise/:tenantSlug/agenda` | **Hecho** (bookings reales) |
| `/enterprise/:tenantSlug/schedules` | **Hecho** |
| `/enterprise/:tenantSlug/metrics` | Placeholder |
| `/enterprise/:tenantSlug/settings` | Placeholder |

## Datos de prueba útiles

- Tenant **manoplo** (`Manoplo Goolplo`): citas reales el **2026-10-16** (13:00 y 17:00). En Agenda, navegar a ese día.
- Status BBDD: solo `confirmed` \| `cancelled`. En UI se derivan `in_progress` / `completed` según la hora actual.
- Free: `is_pro = false` (Manoplo incluido). Límite 2 servicios + sin imagen → modal.

## Comandos

```bash
pnpm dev
pnpm verify
pnpm exec tsc -b
```

## Siguiente trabajo (prioridad)

1. Acciones sobre citas (cancelar / marcar completada persistente) si se quiere ir más allá del estado derivado.
2. Decidir si “Validar QR” entra en MVP web (cámara vs. input de código).
3. Verificar Redirect URLs de Supabase incluyen `/enterprise/login` (dev + prod).
4. Más adelante: `/pricing`, Storage de imágenes, enforcement server-side de límites free.

## Notas para el agente

- Responder en **español**.
- Horario es **tenant-level** (`tenant_availability`), duración por servicio.
- Tras feature: `pnpm verify` + `tsc -b` + actualizar `fastbook-roadmap.md`.
- Commits / deps nuevas solo si se piden.
- Fuera de alcance deliberado en Agenda: cabinas, ocupación de espacios, Validar QR, “Nueva Cita” manual.

## Archivos de verdad

- Reglas: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Este handoff: `handoff.md`
