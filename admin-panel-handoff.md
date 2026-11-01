# Handoff — Fastbook Admin Panel (repo nuevo, SPA local)

Briefing para generar **otro repositorio** con una SPA Vite de superadmin. Pensado para un agente que **no** tiene el contexto del chat.

**Decisión de producto (2026-11-01):**

- App **separada** del monorepo `fastbook` (app pública + enterprise en `app.fastbook.es`).
- Probablemente **nunca se despliega a internet**: uso local desde casa (`pnpm dev` / build + `preview` en localhost).
- El perímetro principal es “no hay front público de ops”. Eso **no** elimina la necesidad de proteger secretos y de cerrar huecos RLS en la BBDD compartida.

Documento hermano de diseño/seguridad: [`admin-panel.md`](./admin-panel.md) (más teórico). Este handoff es **operativo** para bootstrapping del repo nuevo.

---

## 1. Contexto del producto

**Fastbook** = SaaS multitenant de reserva de citas.

| Pieza | URL / repo |
|---|---|
| Marketing | `https://fastbook.es` (Astro, fuera de este repo) |
| App reservas + dashboard empresa | `https://app.fastbook.es` — repo **este**: `fastbook` |
| Admin plataforma | **Nuevo repo** — solo localhost (por ahora) |
| BBDD / Auth / Storage | **Mismo proyecto Supabase** que `fastbook` |

Proyecto Supabase (referencia roadmap): id/ref `ptgltexbfxjqmyozcavt`, nombre `fastbook`.

Modelo de negocio actual:

- 1 usuario Auth (`auth.users`) ↔ 1 fila `public.tenants` vía `tenants.owner_id` (unique parcial).
- Plan: `tenants.is_pro` (boolean). Features Pro: galería de imágenes, YouTube, branding, recordatorios D-1.
- No hay tabla `profiles`. Email del negocio = email de Auth del owner.
- No existen aún: rol `platform_admin`, ban, audit log de ops.

Activación Pro hoy (manual):

```sql
update public.tenants set is_pro = true where slug = '<slug>';
```

El admin panel debe sustituir ese SQL y ampliar a citas/servicios/imágenes/ban.

---

## 2. Objetivo MVP del admin

UI local para el operador de la plataforma:

1. **Listar tenants** (slug, name, `is_pro`, `created_at`, `owner_id`).
2. **Detalle de tenant:** datos + email del owner (Auth Admin API).
3. **Citas** del tenant: listar / cancelar / editar / borrar.
4. **Servicios** + URLs de imágenes / borrar objetos en Storage.
5. **Horarios** (`tenant_availability`): ver / editar.
6. **Toggle Pro** (activar / degradar).
7. **Ban / unban** (requiere migración en el repo `fastbook` — ver §7).
8. (Nice) **Historial** = bookings; más adelante audit de acciones admin.

Fuera de MVP: impersonación, Stripe, métricas fancy, multi-admin RBAC, Stitch obligatorio.

---

## 3. Seguridad — modelo para SPA local (nunca en internet)

### 3.1 Qué resuelve “solo localhost”

- Nadie carga un front de ops en la red pública.
- No hace falta Cloudflare Access ni subdominio `ops.*` **mientras** no se publique.

### 3.2 Qué **no** resuelve

- La API de Supabase sigue en internet.
- Un `service_role` filtrado (commit, backup, malware) = control total de la BBDD.
- Los owners siguen pudiendo mutar `is_pro` vía RLS actual (bug/hueco) hasta que se cierre en migraciones del repo principal.

### 3.3 Arquitectura recomendada (local)

```
[Browser localhost:5173]
        │  fetch /api/...
        ▼
[BFF local Node/Hono :8787]  ← aquí vive SUPABASE_SERVICE_ROLE_KEY
        │
        ▼
[Supabase cloud]  Auth Admin + PostgREST + Storage
```

Vite proxy `/api` → BFF. El bundle del browser **no** contiene `service_role`.

**Alternativa aceptable solo si el repo es 100% privado y nunca se comparte:** client con service role en `.env.local` **sin** prefijo que acabe en builds públicos; sigue siendo más frágil (XSS local, dependencia npm maliciosa). Preferir BFF.

### 3.4 Checklist secretos

- `.env.local` / `.env` en `.gitignore`.
- Nunca `VITE_*` para service role si se puede evitar (Vite inyecta en el client).
- Rotar service role si alguna vez se commitea por error.
- No publicar el repo en GitHub público con historial que haya tenido el secret.

### 3.5 Trabajo en el repo **fastbook** (BBDD)

1. [x] Trigger que **impide** a owners cambiar `is_pro` / `owner_id` (`private.enforce_tenant_platform_columns`, migraciones `20261101170000*` / `70300`). El BFF admin usa **service_role** → puede seguir conmutando Pro.
2. [ ] Columnas ban (`banned_at`, `banned_reason`) + checks en login público/enterprise (app principal).
3. [ ] Opcional: `private.admin_audit_log` (escrituras desde el BFF admin).
4. [ ] Enforcement Free server-side (límites servicios/imágenes/branding).

---

## 4. Stack sugerido del repo nuevo

Alinear con fastbook para reutilizar mental model:

| Pieza | Sugerencia |
|---|---|
| Build | Vite + React 19 + TypeScript |
| Routing | React Router |
| Server state | TanStack Query |
| Styles | CSS kebab-case + tokens `--fb-*` (ver §5) |
| Fonts | `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono` |
| classNames | `classnames` |
| Supabase | `@supabase/supabase-js` en el **BFF** (service role) |
| Tests | Vitest + Testing Library (utils puros) |
| Package manager | `pnpm` |
| React Compiler | Opcional; si se activa, no usar `useMemo`/`useCallback` preventivo |

No hace falta Zustand salvo estado UI trivial.

Estructura orientativa:

```text
fastbook-admin/
  src/                 # SPA
    styles/tokens.css
    pages/
    components/
    lib/               # solo helpers UI / types; sin service_role
  server/              # BFF local
    index.ts
    routes/
    supabase-admin.ts  # createClient(url, SERVICE_ROLE)
  .env.example
  README.md            # “solo localhost; no deploy”
```

---

## 5. Design tokens (copiar tal cual)

Fuente de verdad en fastbook: `src/index.css`.

```css
@import '@fontsource-variable/space-grotesk';
@import '@fontsource-variable/jetbrains-mono';

:root {
  --fb-font: 'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif;
  --fb-font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;

  --fb-primary: #1c2ac8;
  --fb-primary-container: #3b49df;
  --fb-primary-fixed: #e0e0ff;
  --fb-on-primary: #ffffff;
  --fb-secondary: #006a61;
  --fb-tertiary: #005036;
  --fb-error: #ba1a1a;
  --fb-on-surface: #0b1c30;
  --fb-on-surface-variant: #454655;
  --fb-outline: #757687;
  --fb-outline-variant: #c6c5d8;
  --fb-surface: #f8f9ff;
  --fb-surface-container: #e5eeff;
  --fb-surface-container-low: #eff4ff;
  --fb-surface-container-high: #dce9ff;
  --fb-surface-container-lowest: #ffffff;
  --fb-background: #f8f9ff;

  --fb-shadow-sm: 0 1px 2px rgba(11, 28, 48, 0.04);
  --fb-shadow-md: 0 4px 12px rgba(28, 42, 200, 0.18);

  /* Dashboard (enterprise) */
  --fb-dashboard-inline: clamp(1.75rem, 5vw, 4.5rem);

  font-family: var(--fb-font);
  font-size: 16px;
  line-height: 1.5;
  color: var(--fb-on-surface);
  background: var(--fb-background);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Lenguaje visual a imitar (enterprise dashboard)

- Fondo: `radial-gradient(ellipse 70% 40% at 100% 0%, rgba(59, 73, 223, 0.08), transparent)` sobre `--fb-background`.
- Header sticky, blur, borde `--fb-outline-variant`.
- Badge plan: pill uppercase, primary suave (`color-mix` con primary 8–18%).
- Tipografía display: Space Grotesk, tracking ligeramente negativo en títulos.
- Mono para IDs/slugs/tokens: JetBrains Mono.
- Evitar: purple genérico AI, cream+terracotta, broadsheet, dark mode por defecto.
- Estilos condicionales con `classNames(...)`, no `[].filter(Boolean).join(' ')`.
- Naming CSS/archivos: **kebab-case**.

Referencias visuales en el repo origen:

- `src/pages/enterprise-dashboard/enterprise-dashboard.css`
- `src/widgets/enterprise-agenda/agenda-booking-card/`
- `src/widgets/enterprise-schedules/services-catalog/`
- `src/components/confirm-modal/` (acciones destructivas)

No es obligatorio clonar componentes; sí tokens + atmósfera.

---

## 6. Esquema de datos (snapshot)

Types generados: `src/lib/database.types.ts` en fastbook. Regenerar con MCP/CLI si divergen.

### 6.1 `public.tenants`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | URL pública `/:tenantSlug` |
| `name` | text | |
| `booking_note` | text? | |
| `created_at` | timestamptz | |
| `owner_id` | uuid? → `auth.users` | unique parcial; cascade delete user → tenant |
| `is_pro` | boolean not null default false | **proteger de UPDATE owner** |
| `logo_url` | text? | Storage `tenant-branding` |
| `brand_primary` / `brand_secondary` / `brand_surface` / `brand_on_surface` | text? | hex |
| `brand_font` | text? | clave catálogo (space-grotesk, inter, …) |
| `brand_logo_height` | number? | |

### 6.2 `public.services`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `tenant_id` | uuid | cascade |
| `name`, `price`, `description` | | |
| `image_url` | text? | portada (= primera de gallery) |
| `image_urls` | text[] | máx ~10; Pro |
| `youtube_url` | text? | Pro |
| `tags` | text[]? | |
| `duration_minutes` | int | default 30 |
| `active` | boolean | |
| `created_at` | timestamptz | |

Free en producto: máx **2** servicios activos (enforcement UI; server-side parcial).

### 6.3 `public.tenant_availability`

| Columna | Tipo |
|---|---|
| `id` | uuid |
| `tenant_id` | uuid |
| `day_of_week` | 0–6 (0=domingo) |
| `start_time` / `end_time` | time |

Reemplazó a `service_availability` (dropeada).

### 6.4 `public.bookings`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `tenant_id` | uuid | |
| `service_id` | uuid? | nullable; ON DELETE SET NULL |
| `booking_date` | date | |
| `start_time` / `end_time` | time | |
| `customer_name` / `customer_email` | text | |
| `customer_phone` | text? | |
| `notes` | text? | |
| `status` | `'confirmed' \| 'cancelled'` | |
| `check_in_token` | text unique not null | QR check-in |
| `reminder_sent_at` | timestamptz? | solo flujo Pro |
| `created_at` | timestamptz | |

Uniques: `(service_id, booking_date, start_time)` y parcial sin servicio `(tenant_id, booking_date, start_time) WHERE service_id IS NULL`.

### 6.5 Storage

| Bucket | Público | Path | Límites (aprox.) |
|---|---|---|---|
| `service-images` | sí | `{tenant_id}/{service_id}/…` | ~5 MB; webp/jpeg/png |
| `tenant-branding` | sí | `{tenant_id}/…` | ~1 MB; webp/png |

RLS Storage: solo owner del tenant. Admin necesita **service_role** para list/delete arbitrario.

### 6.6 RLS relevante (por qué hace falta service_role / BFF)

| Recurso | Anon / authenticated típico |
|---|---|
| `tenants` SELECT | público `true` |
| `tenants` UPDATE | solo owner (hoy incluye `is_pro` ⚠️) |
| `services` SELECT | activos públicos; owner ve todos los suyos |
| `bookings` SELECT/UPDATE/DELETE | **solo owner** |
| Storage write/delete | solo owner |

→ Listado global de bookings / email de owner / toggle Pro seguro / ban ⇒ **cliente privilegiado** (BFF + service_role) o Edge Functions. La SPA admin **no** puede usar solo la publishable key para el MVP completo.

### 6.7 Email del owner

En edge functions del producto:

```ts
supabaseAdmin.auth.admin.getUserById(owner_id)
```

Replicar en el BFF admin.

---

## 7. Migraciones a hacer en el repo **fastbook** (prerrequisitos)

El agente del admin puede listarlas como dependencias; idealmente otro agente las aplica en `fastbook` vía Supabase MCP/`supabase/migrations`.

1. **Proteger `is_pro`**  
   `BEFORE UPDATE` en `tenants`: si `OLD.is_pro IS DISTINCT FROM NEW.is_pro` y el rol no es service_role / no `private.is_platform_admin()`, raise exception. (O columna managed solo por security definer.)

2. **Ban**  
   ```sql
   alter table public.tenants
     add column if not exists banned_at timestamptz,
     add column if not exists banned_reason text;
   ```  
   En app principal: login enterprise + página pública respetan ban; Auth Admin `ban` + revoke sessions desde el BFF admin.

3. **Audit (opcional MVP+)**  
   `private.admin_audit_log` sin grants a anon/authenticated.

4. Regenerar `database.types.ts` en fastbook (y copiar types al admin o generar allí).

---

## 8. API del BFF (contrato sugerido)

Base: `http://localhost:8787/api` (proxy Vite).

| Método | Path | Acción |
|---|---|---|
| GET | `/tenants` | lista + filtros `q`, `is_pro` |
| GET | `/tenants/:id` | detalle + owner email |
| PATCH | `/tenants/:id` | name, slug, notes, branding (no Pro aquí) |
| POST | `/tenants/:id/pro` | body `{ is_pro: boolean }` |
| POST | `/tenants/:id/ban` | body `{ reason?: string }` |
| POST | `/tenants/:id/unban` | |
| GET | `/tenants/:id/bookings` | query date range / status |
| PATCH | `/bookings/:id` | status, datos cliente, slot |
| DELETE | `/bookings/:id` | |
| GET | `/tenants/:id/services` | |
| PATCH/DELETE | `/services/:id` | |
| DELETE | `/storage` | body `{ bucket, path }` |
| GET | `/tenants/:id/availability` | |
| PUT | `/tenants/:id/availability` | replace set |

Cada mutación: escribir audit si existe la tabla.

Auth del BFF en localhost (elige una, documenta en README):

- **A (simple):** BFF solo escucha `127.0.0.1` + sin auth HTTP (suficiente si el PC es de confianza).
- **B:** header `x-admin-token` = secret local en `.env`.
- **C:** login Supabase del usuario admin + JWT verificado en BFF + allowlist UUID (mejor si algún día se publica).

Para “nunca internet”, **A o B** bastan.

---

## 9. Pantallas UI mínimas

1. **`/`** — tabla tenants (slug, name, badge Free/Pro, banned, created_at) + búsqueda.
2. **`/tenants/:id`** — tabs: Resumen | Citas | Servicios | Horarios | Storage/branding.
3. Acciones peligrosas con confirm modal (estilo `confirm-modal` del origen).
4. Empty/loading/error states claros; IDs en mono.

Rutas no necesitan estar bajo `/platform`; es app dedicada.

---

## 10. Variables de entorno

### Repo admin — `.env.example`

```bash
# Mismo proyecto que fastbook
SUPABASE_URL=https://<ref>.supabase.co

# Solo en el BFF — NUNCA en el browser
SUPABASE_SERVICE_ROLE_KEY=

# Opcional endurecimiento local
ADMIN_HTTP_TOKEN=

# SPA
VITE_API_BASE_URL=/api
```

### Repo fastbook (referencia; no copiar secrets al admin doc público)

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

La publishable key **no** sirve sola para el panel completo.

---

## 11. Convenciones a respetar (origen)

De `.cursor/rules/fastbook.mdc`:

- Responder/documentar en español si el usuario lo pide.
- kebab-case carpetas/archivos CSS.
- `type` preferido sobre `interface`.
- Imports: en monorepo usan `@components` / `@src`; en el repo nuevo definir aliases propios.
- No meter `service_role` en unit tests; mockear.
- Tras features en fastbook: `pnpm verify` + `tsc -b`. En admin: equivalente lint+test.

---

## 12. Archivos ancla en el repo origen (`fastbook`)

| Tema | Path |
|---|---|
| Tokens CSS | `src/index.css` |
| Types BBDD | `src/lib/database.types.ts` |
| Cliente FE (publishable) | `src/lib/supabase-client.ts` |
| Auth session | `src/providers/auth-session-provider.tsx`, `src/hooks/use-auth-session.ts` |
| Owner ↔ tenant | `src/lib/get-tenant-by-owner.ts`, `src/lib/ensure-owned-tenant.ts` |
| Bookings tenant | `src/lib/tenant-bookings.ts` |
| Agenda UI | `src/widgets/enterprise-agenda/` |
| Servicios / imágenes | `src/widgets/enterprise-schedules/` |
| Branding | `src/widgets/enterprise-personalization/`, `supabase/migrations/20261027000000_tenant_branding.sql` |
| Migraciones | `supabase/migrations/*.sql` |
| Edge confirmation (patrón service_role) | `supabase/functions/send-booking-confirmation/` |
| Roadmap / SQL Pro manual | `fastbook-roadmap.md` |
| Diseño seguridad largo | `admin-panel.md` |

---

## 13. Orden de trabajo para el agente del repo nuevo

1. Scaffold Vite React TS + pnpm + tokens CSS + fonts.
2. BFF local con service_role + proxy Vite; healthcheck.
3. `GET /tenants` + página listado (UI con tokens).
4. Detalle + owner email vía Auth Admin.
5. Bookings / services / availability CRUD.
6. Toggle Pro + (cuando existan columnas) ban.
7. Borrado Storage por path.
8. README: solo localhost, secretos, cómo arrancar (`dev` SPA + `dev:server`).
9. Coordinar con fastbook las migraciones §7 (sin ellas, documentar riesgo `is_pro`).

**No** desplegar a Vercel/Netlify/Cloudflare Pages salvo decisión explícita posterior (entonces volver a `admin-panel.md` capas Access + claim `app_metadata`).

---

## 14. Criterios de hecho

- [ ] SPA + BFF arrancan en local y listan tenants reales del proyecto Supabase.
- [ ] Se puede activar/desactivar Pro sin SQL Editor.
- [ ] Se ven y cancelan/borran bookings de cualquier tenant.
- [ ] Se listan servicios e imágenes; se puede borrar un objeto Storage.
- [ ] `service_role` no aparece en el bundle del browser (`grep` / build inspect).
- [ ] README deja claro: tool privada, no publicar.
- [ ] Hueco `is_pro` cerrado en migraciones fastbook **o** issue explícito abierto en el handoff/README.

---

## 15. Resumen en una frase

**Nuevo repo Vite+React con look Fastbook (`--fb-*`), BFF local con service_role contra el mismo Supabase, sin deploy público; el repo `fastbook` sigue siendo dueño del schema y debe proteger `is_pro` y añadir ban.**
`)