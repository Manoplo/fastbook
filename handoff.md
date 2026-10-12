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

## Qué hay hecho (resumen)

1. Bootstrap + CI + tokens + logo.
2. Flujo público de reserva completo.
3. Auth enterprise (Supabase email/password, `owner_id`, RLS owner, check-email).
4. Dashboard shell (header + floating nav + rutas anidadas).
5. Agenda UI shell (sin bookings reales).
6. **Horarios y Servicios:** editor semanal + catálogo + modal PRO (límite 2 servicios / sin imagen).

## Stitch

- Proyecto: **Mobile QR Booking System** (`projects/4608395597619626930`)
- Agenda: **Agenda y Citas New** — `screens/4bbda819ea6e4f0e84a9052102a10fe3`
- Horarios y Servicios: `screens/344caed640c9428b92f49a76ea41d055` (upsell free → modal única, no chips/cards)
- Login empresas: `screens/d66b74e188954958885d664b3626d472`
- Tokens: primary `#1c2ac8` / logo `#3B49DF`, Plus Jakarta Sans, surface `#f8f9ff`

## Arquitectura FE relevante

```
src/
  pages/enterprise-dashboard/   → layout autenticado + Outlet (badge según is_pro)
  pages/enterprise-schedules/   → monta widget
  widgets/enterprise-schedules/ → horario + catálogo + upgrade-pro-modal
  lib/tenant-availability.ts
  lib/tenant-services.ts
  lib/get-tenant-by-slug.ts     → tenant_availability (ya no service_availability)
```

## Rutas enterprise

| Ruta | Estado |
|---|---|
| `/enterprise/login` | Hecho |
| `/enterprise/check-email` | Hecho |
| `/enterprise/:tenantSlug` → redirect `/agenda` | Hecho |
| `/enterprise/:tenantSlug/agenda` | Shell UI (sin bookings reales) |
| `/enterprise/:tenantSlug/schedules` | **Hecho** |
| `/enterprise/:tenantSlug/metrics` | Placeholder |
| `/enterprise/:tenantSlug/settings` | Placeholder |

## Comandos

```bash
pnpm dev
pnpm verify
pnpm exec tsc -b
```

## Siguiente trabajo (prioridad)

1. Conectar **Agenda** con `tenant_availability` + servicios y listar bookings del día.
2. Contadores / filtros / búsqueda sobre datos reales.
3. Validar QR (aplazado) y Redirect URLs de Supabase.
4. Más adelante: `/pricing`, Storage de imágenes, enforcement server-side de límites free.

## Notas para el agente

- Responder en **español**.
- Free: `is_pro = false` (Manoplo incluido). Límite 2 servicios + sin imagen → modal.
- Horario es **tenant-level** (`tenant_availability`), duración por servicio.
- Tras feature: `pnpm verify` + `tsc -b` + actualizar `fastbook-roadmap.md`.
- Commits / deps nuevas solo si se piden.

## Archivos de verdad

- Reglas: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Este handoff: `handoff.md`
