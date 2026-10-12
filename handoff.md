# Handoff — Fastbook (sesión hasta 2026-10-12)

Documento para el siguiente agente tras limpiar contexto. Leer también `.cursor/rules/fastbook.mdc` y `fastbook-roadmap.md`.

## Estado actual

- **Rama:** `feat/dashboard-bookings`
- **App:** React 19 + Vite 8 + TypeScript + **React Compiler** activo
- **MCPs listos:** Supabase (`user-supabase`) y Stitch (`user-stitch`)
- **CI:** `pnpm verify` (lint + tests) en cada push
- **BBDD:** esquema free tier + `tenant_auth` (owner) aplicado en Supabase `fastbook` (`ptgltexbfxjqmyozcavt`)
- **Reserva pública:** operativa en `/:tenantSlug`
- **Auth empresa:** login/signup + dashboard autenticado operativos

## Qué hay hecho (resumen)

1. Bootstrap + CI + tokens + logo.
2. Flujo público de reserva completo.
3. Auth enterprise (Supabase email/password, `owner_id`, RLS owner, check-email).
4. **Dashboard shell (Fase 3 en curso):**
   - Layout header + floating nav
   - Rutas anidadas bajo `/enterprise/:tenantSlug/…`
   - Agenda UI shell (Stitch) sin datos reales
   - Placeholders: schedules / metrics / settings

## Stitch

- Proyecto: **Mobile QR Booking System** (`projects/4608395597619626930`)
- Agenda (dashboard): **Agenda y Citas (Dashboard Empresa)** — preferir la variante nueva `screens/4bbda819ea6e4f0e84a9052102a10fe3` (también existe `f9906e9f957247df95e5173dde8ff31e`)
- **Siguiente UI:** **Horarios y Servicios (Dashboard Empresa)** (`screens/344caed640c9428b92f49a76ea41d055`)
- Login empresas: `screens/d66b74e188954958885d664b3626d472`
- Tokens: primary `#1c2ac8` / logo `#3B49DF`, Plus Jakarta Sans, surface `#f8f9ff`

## Arquitectura FE relevante

```
src/
  pages/enterprise-dashboard/   → layout autenticado + Outlet
  pages/enterprise-agenda/      → /agenda
  pages/enterprise-schedules/   → /schedules (placeholder hoy)
  pages/enterprise-metrics/     → /metrics (placeholder)
  pages/enterprise-settings/    → /settings (placeholder)
  widgets/enterprise-dashboard-nav/
  widgets/enterprise-agenda/    → toolbar + sidebar + timeline vacío
  lib/enterprise-dashboard-paths.ts
```

## Rutas enterprise

| Ruta | Estado |
|---|---|
| `/enterprise/login` | Hecho |
| `/enterprise/check-email` | Hecho |
| `/enterprise/:tenantSlug` → redirect `/agenda` | Hecho |
| `/enterprise/:tenantSlug/agenda` | Shell UI (sin bookings reales) |
| `/enterprise/:tenantSlug/schedules` | **Placeholder — siguiente** |
| `/enterprise/:tenantSlug/metrics` | Placeholder |
| `/enterprise/:tenantSlug/settings` | Placeholder |

Exclusiones deliberadas de Agenda Stitch: chip “Abierto para reservas”, cabinas/ocupación, botón Validar QR.

## Comandos

```bash
pnpm dev
pnpm verify
pnpm exec tsc -b
```

## Siguiente trabajo (prioridad)

Objetivo: pantalla de **creación/gestión de horarios y servicios**, y conectar la **enterprise agenda** con esos servicios.

### 1. Horarios y Servicios (`/schedules`)

1. Cargar en Stitch MCP **Horarios y Servicios (Dashboard Empresa)** (`screens/344caed640c9428b92f49a76ea41d055`).
2. Sustituir el placeholder de `pages/enterprise-schedules` por UI real.
3. CRUD mínimo sobre `services` + `service_availability` del tenant (RLS owner ya permite).
4. Extraer lógica pura a `*.utils.ts` y testear sin importar `supabase-client` en unit tests.

### 2. Conectar Agenda ↔ servicios / availability

1. Que la agenda use los servicios y franjas configurados (no mocks).
2. Listar bookings del día seleccionado en la línea temporal (select owner).
3. Contadores “Citas hoy” / “Previsto” + filtros/búsqueda sobre datos reales.
4. “Nueva Cita” puede quedar deshabilitada o wire mínimo según alcance acordado.

### Fuera de alcance inmediato (salvo que el usuario lo pida)

- Validar QR en web
- Métricas / Ajustes reales
- Multi-usuario por tenant
- Recover password

## Notas para el agente

- Responder en **español**.
- Antes de UI: Stitch MCP. Antes de DDL: Supabase MCP + skill Supabase.
- Tras feature: `pnpm verify` + `tsc -b` + actualizar `fastbook-roadmap.md`.
- Sin `useMemo`/`useCallback` preventivos; estilos condicionales con `classnames`.
- Commits / deps nuevas solo si se piden.
- No generar pantallas ni BE hasta petición explícita.

## Archivos de verdad

- Reglas: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Este handoff: `handoff.md`
