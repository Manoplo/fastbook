# Fastbook — Roadmap

## Visión

Aplicación **multitenant** de reserva de citas, con plan **gratuito** y **features premium**.

## Fase 0 — Bootstrap

- [x] Proyecto React + Vite + TypeScript (+ React Compiler)
- [x] Dependencias FE: TanStack Query, React Router, Zustand
- [x] Reglas del agente Cursor (`.cursor/rules/`)
- [x] Vitest + Testing Library (tests unitarios)
- [x] CI: workflow `verify` (lint + tests en push)
- [x] Esquema BBDD capa gratuita aplicado en Supabase (`free_tier_schema`)
- [x] Enganche con MCP Google Stitch (diseño de pantallas)
- [x] Enganche con MCP Supabase (migración + RLS)
- [x] Cliente Supabase FE + aliases `@src` / `@components`
- [x] `.env.test` con stubs (CI sin `.env.local`; ver regla tests/Supabase)

## Fase 1 — MVP de reserva pública ✅

Interfaz web en `/:tenantSlug`:

1. Seleccionar un **día**
2. Seleccionar una **hora**
3. Seleccionar un **servicio**
4. **Apuntarse** (datos de contacto + confirmación)

Progreso (PRs `#1` main-page, `#2` customer-form):

- [x] Ruta `/:tenantSlug` con hero + logo + calendario (`components/calendar`)
- [x] Franjas horarias (`components/time-slots`)
- [x] Listado de servicios (seed Supabase + `components/service-list`)
- [x] Formulario de contacto del cliente + confirmación de reserva
- [x] `create-booking` / `get-tenant-by-slug` + policies de insert público de bookings
- [x] Home `/` como entrada (CTA hacia alta/login empresa)

Sin paneles avanzados, pagos ni lógica premium. Multitenant desde el modelo de datos.

## Fase 2 — Auth enterprise (login / alta) ✅ (shell)

PR `#3` (`feat/enterprise-auth-login`). Objetivo cumplido: el negocio se registra o inicia sesión y llega a un **dashboard shell** autenticado.

### BBDD + RLS

- [x] Migración `tenant_auth`: `tenants.owner_id` → `auth.users(id)` (unique parcial)
- [x] Helper `public.is_tenant_owner(tenant_id)` + policies owner (CRUD services / availability / bookings del tenant)
- [x] Migración follow-up helper privado (`tenant_auth_private_helper`)
- [x] Types FE regenerados (`database.types.ts`)

SQL en repo:

- [`supabase/migrations/20260930000000_tenant_auth.sql`](supabase/migrations/20260930000000_tenant_auth.sql)
- [`supabase/migrations/20260930000001_tenant_auth_private_helper.sql`](supabase/migrations/20260930000001_tenant_auth_private_helper.sql)

### Auth FE (Supabase Auth email + password)

- [x] `AuthSessionProvider` + `useAuthSession` + `auth-session` helpers
- [x] Guard `RequireAuth` → redirect a `/enterprise/login`
- [x] `signUpTenant` / `signInTenant` / `ensureOwnedTenant` / `getTenantByOwner`
- [x] Perfil pendiente en `user_metadata` (`business_name`, `business_slug`) si hace falta confirmación de email; creación del tenant en el primer login con sesión
- [x] Validaciones / slugs reservados / errores mapeados (`tenant-auth.utils`)
- [x] `completeBusinessSetup` para alta de negocio cuando el user ya tiene sesión sin tenant

### UI / rutas

| Ruta | Página | Estado |
|---|---|---|
| `/` | Home (CTA a enterprise) | Hecho |
| `/:tenantSlug` | Reserva pública | Hecho |
| `/enterprise/login` | Login + signup (toggle) UI Stitch | Hecho |
| `/enterprise/check-email` | Post-signup: “confirma tu email” | Hecho |
| `/enterprise/:tenantSlug` | Dashboard layout (header + floating nav) | Hecho |
| `/enterprise/:tenantSlug/agenda` | Agenda y citas (chrome Stitch; sin listado real aún) | Hecho (shell UI) |
| `/enterprise/:tenantSlug/schedules` | Horarios y servicios | Hecho (CRUD + plan free) |
| `/enterprise/:tenantSlug/metrics` | Métricas y análisis | Placeholder |
| `/enterprise/:tenantSlug/settings` | Ajustes de negocio | Placeholder |

- [x] Pantalla login/signup siguiendo Stitch **Login de Empresas**
- [x] Redirect post-auth a `/enterprise/:tenantSlug` (index → `/agenda`)
- [x] Tests unitarios de utils (`tenant-auth.utils`, `ensure-owned-tenant.utils`) sin depender de tokens reales
- [x] Post-signup → `/enterprise/check-email` (no mensaje inline en login)
- [x] `emailRedirectTo` → `/enterprise/login` (sesión post-confirm → auto dashboard; nunca aterrizar en `/`)
- [x] Loading en botón submit (spinner + texto) + bootstrap en login mientras resuelve tenant
- [x] Signup: detectar email ya registrado (`identities: []` ofuscado) + pre-check slug ocupado
- [x] Migración `tenants_owner_delete_cascade`: borrar user Auth → cascade del tenant (evita huérfanos)

**Config Supabase (manual):** en Authentication → URL Configuration, añadir a Redirect URLs:
`http://localhost:5173/enterprise/login` (y la URL de prod equivalente). Sin esto, Supabase ignora `emailRedirectTo` y vuelve al Site URL (`/`).

### Fuera de alcance de esta fase (siguiente)

- [ ] Flujo de “completar alta de negocio” en UI si `needs_business_setup` (lib ya existe)
- [ ] Miembros / roles multi-usuario por tenant (hoy solo `owner_id`)
- [ ] Recover password / magic link
- [ ] Features premium

## Fase 3 — Dashboard tenant (en curso)

Rama: `feat/dashboard-bookings`. Referencia Stitch: **Agenda y Citas (Dashboard Empresa)** (`screens/4bbda819ea6e4f0e84a9052102a10fe3`, proyecto Mobile QR Booking System).

### Hecho en esta iteración

- [x] Layout dashboard: header (logo + badge según `tenants.is_pro`; **sin** chip “Abierto para reservas”)
- [x] Floating bar de navegación (`widgets/enterprise-dashboard-nav`)
- [x] Rutas internas anidadas bajo `/enterprise/:tenantSlug/…` + pantallas placeholder (metrics / settings)
- [x] Agenda shell UI: toolbar (sin “Cabinas activas”, **sin** “Validar QR”), sidebar (búsqueda + mini-calendario + filtros; **sin** “Ocupación de espacios”), timeline vacío
- [x] Paths helper + tests: `enterprise-dashboard-paths`, `enterprise-agenda.utils`
- [x] **Horarios y Servicios** (`/schedules`): UI Stitch + CRUD `tenant_availability` / `services`
- [x] Migración `tenant_availability_and_pro`: `tenants.is_pro`, horario a nivel tenant; drop `service_availability`
- [x] Límites free unificados en modal PRO (máx. 2 servicios, sin imagen); CTA → `/pricing` (pendiente)

### Fuera de alcance deliberado (Agenda Stitch)

- Chip verde “Abierto para reservas”
- Métrica “Cabinas activas” / panel “Ocupación de espacios” (no aplica al modelo actual)
- Botón “Validar QR” (posible en web vía cámara/`BarcodeDetector` o código manual; aplazado hasta decidir flujo)
- Chips/cards de upsell free repetidos (Stitch); se unificó en modal
- Upload real a Storage / Stripe / página `/pricing`

### Siguiente

1. **Conectar Agenda** con `tenant_availability` + servicios y listar bookings reales del día (timeline + contadores + filtros).
2. Decidir si “Validar QR” entra en MVP web (cámara vs. input de código).
3. Verificar Redirect URLs de Supabase incluyen `/enterprise/login` (dev + prod).
4. (Más adelante) Página `/pricing` + enforcement server-side de límites free.

Detalle operativo: ver `handoff.md`.

## Esquema de datos (capa gratuita + auth)

Modelo pensado para `booked.es/{slug}`: el **tenant** es la empresa; el público lee servicios y disponibilidad; las reservas se escriben con policy controlada; el **owner** gestiona su tenant autenticado.

```mermaid
erDiagram
  auth_users ||--o| tenants : "owner_id"
  tenants ||--o{ services : "tiene"
  tenants ||--o{ tenant_availability : "define"
  tenants ||--o{ bookings : "recibe"
  services ||--o{ bookings : "reserva"

  tenants {
    uuid id PK
    text slug UK
    text name
    text booking_note
    boolean is_pro
    uuid owner_id FK
    timestamptz created_at
  }

  services {
    uuid id PK
    uuid tenant_id FK
    text name
    numeric price
    text description
    text image_url
    text_array tags
    integer duration_minutes
    boolean active
    timestamptz created_at
  }

  tenant_availability {
    uuid id PK
    uuid tenant_id FK
    smallint day_of_week
    time start_time
    time end_time
  }

  bookings {
    uuid id PK
    uuid tenant_id FK
    uuid service_id FK
    date booking_date
    time start_time
    time end_time
    text customer_name
    text customer_email
    text customer_phone
    text status
    timestamptz created_at
  }
```

### Tablas

| Tabla | Qué es |
|---|---|
| `tenants` | Empresa/negocio. `slug` único → URL pública. `owner_id` → `auth.users`. `is_pro` (plan). `booking_note` antes de confirmar. |
| `services` | Catálogo por tenant. `duration_minutes` calcula huecos; `active` oculta sin borrar. Free: máx. 2 (UI). |
| `tenant_availability` | Ventanas semanales del negocio (`day_of_week` 0=dom…6=sáb + `start_time`/`end_time`). |
| `bookings` | Reserva concreta. Unique `(service_id, booking_date, start_time)` evita dobles. Status: `confirmed` \| `cancelled`. |

### Relaciones y flujo

1. Un **tenant** tiene muchos **services**, un **horario semanal** (`tenant_availability`) y un **owner** (`owner_id`).
2. El FE público calcula slots libres: ventanas del tenant − bookings confirmadas, usando `duration_minutes` del servicio.
3. Al apuntarse se crea un **booking** ligado a tenant + service + fecha/hora + datos del cliente.
4. Alta empresa: `signUp` → (opcional confirm email) → `ensureOwnedTenant` inserta fila en `tenants` con `owner_id` (`is_pro = false` por defecto).

### RLS (Row Level Security)

- RLS activado en las 4 tablas.
- Lectura pública: `tenants`, `services` activos, `tenant_availability`.
- Insert público de `bookings` (policies de booking público; ver migraciones `20260928*`).
- Owner autenticado: CRUD de services / `tenant_availability` / bookings de su tenant vía `is_tenant_owner`.

### SQL de referencia

| Migración | Qué |
|---|---|
| [`20260927000000_free_tier_schema.sql`](supabase/migrations/20260927000000_free_tier_schema.sql) | Esquema base + RLS lectura pública |
| [`20260928000000_public_booking_insert.sql`](supabase/migrations/20260928000000_public_booking_insert.sql) | Insert público bookings |
| [`20260928000001_fix_bookings_insert_tenant_check.sql`](supabase/migrations/20260928000001_fix_bookings_insert_tenant_check.sql) | Check tenant en insert |
| [`20260930000000_tenant_auth.sql`](supabase/migrations/20260930000000_tenant_auth.sql) | `owner_id` + RLS owner |
| [`20260930000001_tenant_auth_private_helper.sql`](supabase/migrations/20260930000001_tenant_auth_private_helper.sql) | Helper privado follow-up |
| [`20261012000000_tenant_availability_and_pro.sql`](supabase/migrations/20261012000000_tenant_availability_and_pro.sql) | `is_pro` + `tenant_availability`; drop `service_availability` |

**Proyecto Supabase:** `fastbook` (`ptgltexbfxjqmyozcavt`, `eu-west-1`).

## Notas

- FE: Stitch → implementación React.
- BE: Supabase (tablas, RLS, Auth, clientes).
- Stack FE: `@tanstack/react-query`, `react-router-dom`, `zustand`, `react-hook-form` (enterprise login), `classnames`.
- Tests: `pnpm test` (watch) / `pnpm test:run` (CI). Archivos `*.test.ts(x)` / `*.spec.ts(x)` en `src/`.
- Tras cada feature larga: actualizar **este archivo** (hecho / pendiente / siguiente) para el siguiente agente.
