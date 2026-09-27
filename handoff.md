# Handoff — Fastbook (sesión hasta 2026-09-27)

Documento para el siguiente agente tras limpiar contexto. Leer también `.cursor/rules/fastbook.mdc` y `fastbook-roadmap.md`.

## Estado actual

- **Rama:** `feature/main-page` (trackea `origin/feature/main-page`)
- **App:** React 19 + Vite 8 + TypeScript + **React Compiler** activo
- **MCPs listos:** Supabase (`user-supabase`, auth OK) y Stitch (`user-stitch`)
- **CI:** `.github/workflows/verify.yml` → `pnpm verify` (lint + tests) en cada push
- **BBDD:** esquema capa gratuita **ya aplicado** en Supabase proyecto `fastbook`

## Qué se hizo en esta sesión (resumen)

1. Bootstrap deps: TanStack Query, React Router, Zustand; rules + roadmap.
2. Vitest + Testing Library + script `pnpm verify`.
3. Workflow GitHub Actions `verify` (Node 24, ubuntu-26.04, actions actualizadas).
4. Esquema SQL → migración local + **apply_migration** en Supabase.
5. Feature UI calendario en `/:tenantSlug` según diseño Stitch desktop.
6. Logo sustituido por Stitch: **“Logo fastbook: Calendario + Rayo Lineal”**.
7. Regla: **no usar `useMemo`/`useCallback`** (React Compiler).

## Supabase

| Campo | Valor |
|---|---|
| Proyecto | `fastbook` |
| Project ID / ref | `ptgltexbfxjqmyozcavt` |
| Región | `eu-west-1` |
| Migración aplicada | `free_tier_schema` |
| SQL en repo | `supabase/migrations/20260927000000_free_tier_schema.sql` |

**Tablas:** `tenants`, `services`, `service_availability`, `bookings` (RLS on; SELECT público en tenants / services activos / availability; bookings sin policy de insert pública → service_role).

**Pendiente:** seed de datos de prueba; cliente Supabase en el FE; escritura de bookings.

## Stitch

- Proyecto: **Mobile QR Booking System** (`projects/4608395597619626930`) — es el de Fastbook.
- Pantalla de referencia UI: **Selección de Cita y Servicios (Desktop)** (`…/screens/486c818668584d6cb564a4eb9006dab9`)
- Logo actual: **Logo fastbook: Calendario + Rayo Lineal** (`…/screens/4967316844124ee5bc79b8410e9f28d4`) → `src/assets/fastbook-logo.svg`
- Tokens clave: primary `#1c2ac8` / logo blue `#3B49DF`, font **Plus Jakarta Sans** (`@fontsource-variable/plus-jakarta-sans`), surface `#f8f9ff`

## Arquitectura FE (ya en uso)

```
src/
  pages/booking/     → ruta /:tenantSlug (hero + logo + Calendar)
  pages/home/        → ruta / (placeholder alta negocio)
  components/calendar/   → reutilizable, funcional, tests
  components/fastbook-logo/
  assets/fastbook-logo.svg
  index.css          → design tokens --fb-*
```

Convenciones: kebab-case; `type` > `interface`; colocalizar css/types/utils/test; Fontsource para tipografías.

## Rutas

| Ruta | Página |
|---|---|
| `/` | Alta empresa (placeholder) |
| `/:tenantSlug` | Flujo de reserva (solo calendario por ahora) |

Ejemplo local: `pnpm dev` → `/demo-salon`

## Comandos

```bash
pnpm dev
pnpm verify          # oxlint + vitest run
pnpm exec tsc -b     # check types (obligatorio tras features)
pnpm test            # watch
```

## Siguiente trabajo sugerido (PR siguientes)

Orden lógico según roadmap Fase 1 + diseño Stitch:

1. **Franjas horarias** (Paso 2 del diseño desktop) bajo el calendario.
2. **Seed Supabase** (tenant + services + availability) y leer por `slug` en `/:tenantSlug`.
3. **Listado de servicios** (Paso 3 del diseño).
4. **Datos de contacto / confirmación** (modales Stitch existentes).
5. **Formulario de alta** en `/`.
6. Conectar `availableDates` del Calendar a datos reales (hoy: todos los días futuros “disponibles”).

## Notas para el agente

- Responder en **español**.
- Antes de UI nueva: cargar pantalla en Stitch MCP.
- Antes de DDL/ops BBDD: Supabase MCP (`apply_migration` / `execute_sql`).
- Tras feature: `pnpm verify` + `tsc -b`.
- Tests solo casos críticos (no “¿está el botón en el DOM?”).
- **No** `useMemo`/`useCallback` preventivos.
- Commits / deps nuevas solo si el usuario lo pide.
- En `vite.config.ts` el React Compiler se desactiva en `mode === 'test'` (Babel preset solo fuera de test).

## Archivos de verdad

- Reglas agente: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Este handoff: `handoff.md`
