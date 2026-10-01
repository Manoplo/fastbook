# Handoff — Fastbook (sesión hasta 2026-09-30)

Documento para el siguiente agente tras limpiar contexto. Leer también `.cursor/rules/fastbook.mdc` y `fastbook-roadmap.md`.

## Estado actual

- **Rama:** `master` (trackea `origin/master`) — la siguiente feature irá en **rama nueva** (aún no creada)
- **App:** React 19 + Vite 8 + TypeScript + **React Compiler** activo
- **MCPs listos:** Supabase (`user-supabase`, auth OK) y Stitch (`user-stitch`)
- **CI:** `.github/workflows/verify.yml` → `pnpm verify` (lint + tests) en cada push
- **BBDD:** esquema capa gratuita **ya aplicado** en Supabase proyecto `fastbook`
- **Flujo público de reserva:** operativo en `/:tenantSlug` (día → hora → servicio → datos → confirmación)

## Qué hay hecho (resumen)

1. Bootstrap deps + rules + roadmap + Vitest + CI.
2. Esquema SQL capa gratuita + seed de prueba.
3. Flujo de reserva público completo en `/:tenantSlug`.
4. Cliente Supabase FE + `create-booking` / `get-tenant-by-slug`.
5. Logo Stitch + tokens de diseño.

## Supabase

| Campo | Valor |
|---|---|
| Proyecto | `fastbook` |
| Project ID / ref | `ptgltexbfxjqmyozcavt` |
| Región | `eu-west-1` |
| Migración aplicada | `free_tier_schema` |
| SQL en repo | `supabase/migrations/20260927000000_free_tier_schema.sql` |

**Tablas:** `tenants`, `services`, `service_availability`, `bookings` (RLS on).

### Auth de tenants — gap actual

`tenants` **no** está ligado a autenticación. Columnas actuales:

`id`, `slug`, `name`, `booking_note`, `created_at`

No hay email/password ni FK a `auth.users`. El alta de negocio en `/` sigue siendo placeholder. Para el dashboard de empresa hay que **modificar el esquema** (nueva migración) y usar **Supabase Auth** (email + password).

Dirección esperada (a validar al implementar):

- Alta / login del tenant con `supabase.auth.signUp` / `signInWithPassword`.
- Vincular el usuario autenticado al tenant (p. ej. `tenants.owner_id uuid references auth.users(id)` o tabla `tenant_members`).
- Ajustar RLS del dashboard para que solo el owner/miembro lea/escriba datos de su tenant.
- **No** guardar passwords en `public.tenants`; viven en `auth.users`.

## Stitch

- Proyecto: **Mobile QR Booking System** (`projects/4608395597619626930`) — es el de Fastbook.
- Pantalla reserva (pública): **Selección de Cita y Servicios (Desktop)** (`…/screens/486c818668584d6cb564a4eb9006dab9`)
- **Login empresas (siguiente UI):** **Login de Empresas - fastbook Pro Business (Desktop)** (`…/screens/d66b74e188954958885d664b3626d472`)
- Dashboard (referencia posterior): **Agenda y Citas (Dashboard Empresa)** (`…/screens/f9906e9f957247df95e5173dde8ff31e`)
- Logo actual: **Logo fastbook: Calendario + Rayo Lineal** (`…/screens/4967316844124ee5bc79b8410e9f28d4`) → `src/assets/fastbook-logo.svg`
- Tokens clave: primary `#1c2ac8` / logo blue `#3B49DF`, font **Plus Jakarta Sans** (`@fontsource-variable/plus-jakarta-sans`), surface `#f8f9ff`

## Arquitectura FE (ya en uso)

```
src/
  pages/booking/     → ruta /:tenantSlug (flujo reserva público)
  pages/home/        → ruta / (placeholder alta negocio)
  components/…
  lib/               → supabase-client, create-booking, get-tenant-by-slug, …
  index.css          → design tokens --fb-*
```

Convenciones: kebab-case; `type` > `interface`; colocalizar css/types/utils/test; Fontsource para tipografías.

## Rutas

| Ruta | Página | Estado |
|---|---|---|
| `/` | Alta empresa (placeholder) | Existe |
| `/:tenantSlug` | Flujo de reserva público | Hecho |
| `/enterprise/login` | Login email+password del tenant | **Pendiente** |
| `/enterprise/:tenantSlug` | Dashboard del tenant (tras login) | **Pendiente** |

Propuesta de naming (revisable al implementar): prefijo `/enterprise/…` para no colisionar con el slug público `/:tenantSlug`.

Ejemplo local reserva: `pnpm dev` → `/demo-salon`

## Comandos

```bash
pnpm dev
pnpm verify          # oxlint + vitest run
pnpm exec tsc -b     # check types (obligatorio tras features)
pnpm test            # watch
```

## Siguiente trabajo (prioridad) — Dashboard tenant

Objetivo: que el tenant acceda a su dashboard tras registrarse / iniciar sesión.

Orden sugerido en **rama nueva**:

1. **BBDD + Auth**
   - Migración: vincular `tenants` ↔ `auth.users` (owner / members).
   - Políticas RLS para lectura/escritura autenticada por tenant.
   - Flujo de alta (signUp) + login (signIn) con email+password vía Supabase Auth.
   - Seed / usuario de prueba para desarrollo.

2. **Rutas enterprise**
   - `/enterprise/login` → formulario de acceso.
   - Tras auth OK → `/enterprise/:tenantSlug` (dashboard; puede ser shell mínimo al inicio).
   - Guard de ruta: sin sesión → redirect a login.

3. **Pantalla de login (UI)**
   - Antes de implementar: cargar en Stitch MCP la pantalla **Login de Empresas - fastbook Pro Business (Desktop)** (`screens/d66b74e188954958885d664b3626d472`).
   - Implementar FE siguiendo ese diseño (tokens existentes `--fb-*`).

4. **Dashboard (después del login)**
   - Referencia Stitch: **Agenda y Citas (Dashboard Empresa)** (`screens/f9906e9f957247df95e5173dde8ff31e`).
   - Fuera del alcance mínimo si solo se pide login + shell autenticado; confirmar con el usuario.

## Notas para el agente

- Responder en **español**.
- Antes de UI nueva: cargar pantalla en Stitch MCP.
- Antes de DDL/ops BBDD: Supabase MCP (`apply_migration` / `execute_sql`) + skill Supabase.
- Tras feature: `pnpm verify` + `tsc -b`.
- Tests solo casos críticos (no “¿está el botón en el DOM?”).
- **No** `useMemo`/`useCallback` preventivos.
- Commits / deps nuevas solo si el usuario lo pide.
- En `vite.config.ts` el React Compiler se desactiva en `mode === 'test'` (Babel preset solo fuera de test).
- No generar pantallas ni BE hasta que se pida explícitamente (este handoff solo planifica).

## Archivos de verdad

- Reglas agente: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Este handoff: `handoff.md`
