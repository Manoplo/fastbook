# Admin Panel Fastbook — hallazgos, seguridad y plan

Documento de diseño para un **panel superadmin** de la plataforma. Objetivo: operar tenants, citas, servicios, imágenes y plan Pro sin SQL manual, con acceso restringido al operador de la plataforma.

**Decisión actual (2026-11-01):** SPA en **repo nuevo**, uso **local (localhost)**, probablemente **sin deploy** a internet. Handoff operativo para el otro agente/repo: [`admin-panel-handoff.md`](./admin-panel-handoff.md). Las secciones de Cloudflare Access / `ops.fastbook.es` quedan como plan B si algún día se publica.

**Alcance de esta iteración (MVP admin):** lectura/escritura sobre usuarios (tenants/owners), citas, servicios, imágenes, historial básico; degradar Pro; banear. Iterar UI después.

**Prioridad #1:** estrategias de securización. Sin ellas, un panel con `service_role` o bypass de RLS es el vector más peligroso del producto.

---

## 1. Hallazgos del estado actual

### 1.1 Qué hay hoy

| Área | Estado |
|---|---|
| Auth | Supabase Auth email/password. Sesión en FE (`AuthSessionProvider`). Sin OAuth / MFA en app. |
| Modelo de negocio | 1 `auth.users` ↔ 1 `tenants` vía `tenants.owner_id`. |
| Plan | `tenants.is_pro` (boolean). Activación actual: SQL manual (ver roadmap). |
| Roles app | Solo **owner** del tenant. No existe `admin` / `superadmin` / `banned`. |
| Perfiles | No hay tabla `profiles`. Identidad = `auth.users` (+ metadata de alta en `user_metadata`). |
| Rutas | Públicas `/:tenantSlug`; enterprise bajo `/enterprise/...` con `RequireAuth` (solo “hay sesión”). |
| Slug `admin` | Reservado en `tenant-auth.utils` para no colisionar con URLs públicas; **no** es un rol. |
| Auditoría | No hay audit log de acciones privilegiadas. |
| Edge functions | `send-booking-confirmation` y `send-booking-reminders`; usan `service_role` con secretos propios (`verify_jwt=false`). |

### 1.2 Datos relevantes para el panel

- **Tenants:** slug, name, `is_pro`, branding, `owner_id`, timestamps.
- **Servicios:** catálogo por tenant, `image_urls` / `image_url`, YouTube, activo/precio/duración.
- **Storage:** buckets públicos `service-images` y `tenant-branding` (paths `{tenant_id}/…`).
- **Bookings:** datos de cliente (nombre/email/teléfono), estado, check-in token, reminder.
- **Availability:** horarios semanales del tenant.
- **Historial:** hoy = filas de `bookings` (+ estados). No hay tabla de eventos de plataforma.

### 1.3 RLS actual (implicaciones)

- Lectura pública amplia de `tenants` y availability; servicios activos visibles.
- Bookings: solo el **owner** del tenant (SELECT/UPDATE/DELETE); INSERT público controlado.
- No hay policy “platform admin”. Un listado global de bookings/emails **no** es posible con la anon/authenticated key sin romper el modelo.
- Helpers de ownership viven en schema `private` (`private.is_tenant_owner`) — buen patrón a reutilizar para `private.is_platform_admin`.

### 1.4 Huecos de seguridad

1. **`is_pro` / `owner_id` (cerrado 2026-11-01):** trigger `private.enforce_tenant_platform_columns` — JWT `authenticated`/`anon` no pueden mutar esas columnas ni insertar `is_pro = true`. Solo SQL sin JWT (Studio/MCP) o JWT `service_role`. Ver migraciones `20261101170000*` / `20261101170300*`.
2. **Límites Free solo UI (abierto):** máx. 2 servicios, galería, youtube, branding — abusables vía API. Siguiente epic de enforcement server-side.
3. **Claims en `user_metadata`:** inseguros para autorización. Flag admin → **`app_metadata`** (solo service_role / Admin API).
4. **JWT no se invalida al borrar/banear** hasta que expire o se revocan sesiones. Ban efectivo = ban Auth + revoke sessions + checks server-side.
5. **`service_role` nunca en el frontend publicado.** En SPA admin local: BFF con service_role; no bundle Vite.

---

## 2. Objetivo de producto (MVP)

Ruta exclusiva (p. ej. `/platform/admin` o `/ops`) visible y usable **solo** por el superadmin de Fastbook.

Capacidades mínimas:

| Capacidad | Lectura | Escritura |
|---|---|---|
| Listado de tenants / owners | sí | — |
| Detalle: datos negocio + email Auth | sí | editar name/slug/branding (opcional MVP) |
| Citas del tenant | sí | cancelar / editar / borrar |
| Servicios + imágenes (URLs / Storage) | sí | CRUD + borrar objetos Storage |
| Horarios | sí | CRUD |
| Plan Pro | ver `is_pro` | activar / degradar |
| Ban | ver estado | banear / desbanear (Auth + flag tenant) |
| Historial | bookings + (fase 2) audit log de acciones admin | — |

Fuera de alcance inicial: impersonación de owner, métricas globales fancy, Stripe, multi-admin con RBAC fino, UI Stitch pulida (puede ser UI funcional).

---

## 3. Seguridad — estrategias (lo más importante)

### 3.1 Principio: defensa en profundidad

Ningún control solo basta. El panel debe fallar cerrado en **varias capas**:

```
[ Red / Zero Trust ] → [ Auth fuerte + MFA ] → [ Claim admin en app_metadata ]
        → [ Edge / RLS que exigen admin ] → [ Audit + alertas ]
```

Si alguien encuentra la URL del SPA, **no** debe poder leer ni mutar nada privilegiado. La UI es cosmético; la API y la BBDD son la frontera real.

### 3.2 Lo que **no** sirve (o sirve mal) en web

| Idea | Realidad |
|---|---|
| **Filtrar por MAC address** en el navegador | **Inviable.** Los browsers no exponen la MAC (privacidad). No hay API web estándar para “solo este dispositivo por MAC”. En redes locales a veces se usa en Wi‑Fi/DHCP, pero **no** llega a tu app en Supabase/Vercel. Descartar como control de la app. |
| Comprobar IP / admin solo en React | Trivial de saltar (cualquiera llama a la API). La restricción debe estar en **edge / Cloudflare / Supabase**, no en el cliente. |
| Ocultar la ruta (`/admin` secreto) | Security through obscurity. Útil como ruido mínimo, inútil solo. |
| Meter `service_role` en el Vite bundle | Compromiso total de la BBDD. Prohibido. |
| `user_metadata.is_admin = true` | El usuario puede intentar manipular metadata; **no** usar para authz. |

### 3.3 Controles recomendados (orden de impacto)

#### Capa A — Perímetro tipo “VPN personal” (recomendado #1)

Equivalente práctico a “solo mis dispositivos / mi red”, sin inventar MAC:

| Opción | Cómo | Pros | Contras |
|---|---|---|---|
| **A1. Cloudflare Access (Zero Trust)** delante de `app.fastbook.es/platform/*` o de un subdominio `ops.fastbook.es` | Política: email allowlist (tu Gmail) + OTP / IdP; opcional device posture | Muy cercano a “VPN corporativa personal”; no expone el SPA al mundo; MFA del IdP | Dependencia Cloudflare; hay que enrutar ese host/path |
| **A2. Tailscale / WireGuard / Cloudflare Tunnel** | Admin solo escuchando en IP de cola o túnel; DNS privado | Excelente aislamiento | Menos cómodo desde móvil/café si no llevas el cliente VPN |
| **A3. Allowlist de IP** (casa/oficina/VPN egress) en Cloudflare WAF o en Edge Function | `CF-Connecting-IP` / header de confianza ∈ allowlist | Simple | IP doméstica cambia; móvil 4G rompe el acceso; no identifica “tu portátil” |
| **A4. Combinar A1 + A3** | Access **y** IP conocidas | Máxima fricción para atacantes | Más ops |

**Recomendación MVP:** subdominio dedicado `ops.fastbook.es` (o path `/platform`) detrás de **Cloudflare Access** con allowlist de 1–2 emails y MFA. IP allowlist como refuerzo opcional, no como único control.

> Nota: restringir solo en Cloudflare **no** sustituye authz en Supabase. Si mañana alguien apunta otro cliente a la API con tu JWT robado, RLS/Edge deben seguir exigiendo admin.

#### Capa B — Identidad de plataforma (obligatoria)

1. Crear (o marcar) **un** usuario Auth como operador.
2. Setear **`app_metadata`: `{ "role": "platform_admin" }`** (o `is_platform_admin: true`) **solo** vía Dashboard / Admin API / migración one-shot con service_role.
3. Helper SQL `private.is_platform_admin()` que lea el claim del JWT (`auth.jwt() -> 'app_metadata' ->> 'role'`), `SECURITY DEFINER`, schema `private`.
4. **Nunca** confiar en `user_metadata` ni en un boolean en una fila editable por el owner.

Allowlist hardcodeada adicional (defense in depth): en Edge Functions, además del claim, comprobar `user.id` ∈ `PLATFORM_ADMIN_USER_IDS` (secret/env). Así un claim mal puesto no abre el panel si el id no está en la lista.

#### Capa C — Superficie de API

**No** abrir policies RLS del estilo `if is_platform_admin then all` sobre `bookings` desde el cliente authenticated de forma amplia sin pensarlo: un XSS en el panel + sesión admin = exfiltración masiva.

Patrones aceptables (elegir uno; preferencia marcada):

| Patrón | Descripción | Preferencia |
|---|---|---|
| **B1. Edge Functions Admin API** | SPA admin → `functions.invoke('admin-…')` con JWT del usuario; la function verifica claim + allowlist + (opcional) IP; usa `service_role` solo en servidor | **Preferido MVP** — audit centralizado, rate limit, menos superficie RLS |
| **B2. RLS admin** | Policies `private.is_platform_admin()` en tablas sensibles | OK para lectura; escritura peligrosa si el SPA tiene bugs; combinar con B1 para mutaciones |
| **B3. Solo SQL / Studio** | Seguir con SQL | No cumple el objetivo del panel |

Mutaciones sensibles (ban, toggle Pro, delete masivo) **solo** vía Edge Function + audit row.

#### Capa D — Auth fuerte del humano

- MFA obligatoria en la cuenta admin (Supabase MFA o IdP detrás de Cloudflare Access).
- Sesión corta / refresh estricto para el rol admin (si se puede aislar).
- Al banear a un tenant owner: `auth.admin.updateUserById` (ban) + **revoke sessions**.
- Password de admin distinto y gestor de contraseñas; sin reutilizar el email de un tenant de prueba “comodín”.

#### Capa E — Separación de despliegue (muy recomendable)

- Host el panel en **`ops.fastbook.es`** (otro proyecto Vite o same app con route tree separado) con Access.
- La app pública `app.fastbook.es` **no** incluye el bundle del admin (code-split + no link público), o directamente otro deploy. Reduce fugas por sourcemaps / rutas descubiertas / XSS cruzado desde la app de reservas.

Mínimo viable si se queda monorepo SPA: ruta `/platform/admin` + guard FE + Access en ese path; aceptar que el JS admin puede acabar en el bundle (mitigar con lazy route + Access).

#### Capa F — Cierre de privilegios de tenant

- [x] Trigger `BEFORE INSERT OR UPDATE` en `tenants` para `is_pro` / `owner_id` (hecho).
- [ ] Enforcement Free (servicios / imágenes / branding) en DB.
- Revisar que Storage no permita path traversal entre `tenant_id`.

#### Capa G — Auditoría y detección

Tabla `private.admin_audit_log` (o `public` sin grants a anon/authenticated):

- `actor_user_id`, `action`, `target_type`, `target_id`, `payload_json`, `ip`, `user_agent`, `created_at`
- Toda mutación admin escribe una fila.
- Alertas opcionales (email Resend) en: ban, grant/revoke Pro, delete tenant.

#### Capa H — Operativa

- Secretos solo en Supabase secrets / CI; rotación documentada.
- No loguear PII de clientes (emails/teléfonos) en claro en logs de Edge más de lo necesario.
- Checklist post-deploy: advisors de Supabase, prueba con usuario no-admin (debe 401/403), prueba sin pasar Access (debe bloquear Cloudflare).

### 3.4 Diagrama mental del request feliz

```
Operador
  → Cloudflare Access (email allowlist + MFA)
  → ops.fastbook.es/platform/admin (SPA)
  → Login Supabase (cuenta admin + MFA)
  → JWT con app_metadata.role = platform_admin
  → Edge Function admin-* 
       checks: JWT válido + claim + allowlist user id [+ IP opcional]
  → service_role / SQL privilegiado
  → admin_audit_log
```

Request de un desconocido: cortado en Access o en la Edge Function. Request de un tenant owner normal: sin claim → 403 aunque conozca la URL.

### 3.5 Comparativa rápida “VPN personal”

| Enfoque | ¿Parecido a VPN corporativa? | Esfuerzo | Recomendado |
|---|---|---|---|
| Cloudflare Access en `ops.*` | Sí (SSO/MFA + allowlist) | Bajo–medio | **Sí, default** |
| Tailscale + app solo en red cola | Sí (red privada) | Medio | Sí si ya usas Tailscale |
| Solo allowlist IP | Parcial | Bajo | Refuerzo, no único |
| MAC filtering | No aplicable en web | — | **No** |
| “Ruta secreta” | No | Nulo | No como control |

---

## 4. Modelo de datos propuesto

### 4.1 Auth / rol

- `auth.users.app_metadata.role = 'platform_admin'` (único o pocos ids).
- Env `PLATFORM_ADMIN_USER_IDS=uuid1,uuid2` en Edge Functions.

### 4.2 Ban de tenant / owner

Propuesta mínima:

```text
tenants.banned_at timestamptz null
tenants.banned_reason text null
```

Más Auth: `ban_duration` / ban user vía Admin API para impedir login enterprise.

Efectos:

- Login enterprise: si banned → mensaje y sign-out.
- Página pública `/:tenantSlug`: 404 o “negocio no disponible” (no filtrar datos).
- Edge de confirmación/reminders: no enviar si banned (opcional).

### 4.3 Audit

```text
private.admin_audit_log (
  id uuid pk,
  actor_id uuid not null,
  action text not null,          -- 'tenant.set_pro' | 'tenant.ban' | ...
  target_table text,
  target_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  created_at timestamptz default now()
)
```

Sin grants a `anon`/`authenticated`. Solo service_role / security definer.

### 4.4 Helper

```sql
-- sketch
create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin',
    false
  );
$$;
```

(Exacto a validar con docs actuales de claims JWT de Supabase en el momento de implementar.)

---

## 5. Plan de implementación (para el agente ejecutor)

Orden sugerido; cada fase debe dejar el sistema al menos tan seguro como antes.

### Fase 0 — Cerrar huecos

1. [x] Migración: proteger `tenants.is_pro` / `owner_id` (trigger + `auth.role()`).
2. [x] Roadmap: Pro solo vía Studio/MCP o service_role.
3. [ ] Enforcement Free server-side; advisors restantes (`booking_starts_at` search_path; leaked-password Auth).

### Fase 1 — Identidad admin + perímetro

1. Decidir host: **`ops.fastbook.es`** (preferido) vs path en `app.fastbook.es`.
2. Configurar Cloudflare Access (allowlist email + MFA).
3. Marcar usuario admin en `app_metadata` + secret allowlist de UUIDs.
4. Helper `private.is_platform_admin()`.

### Fase 2 — Admin API (Edge)

Una function (o grupo) `admin-api` con acciones versionadas, p. ej.:

- `listTenants` / `getTenant`
- `listBookings` / `updateBooking` / `deleteBooking`
- `listServices` / `updateService` / `deleteService` (+ Storage delete)
- `setPro(tenantId, boolean)`
- `banTenant` / `unbanTenant`
- `listAudit` (read)

Cada acción: verify JWT → admin checks → ejecutar → audit log → respuesta mínima necesaria.

`verify_jwt`: preferible validar en código con secret/jwks (como otras functions del repo) **y** no confiar solo en el gateway.

### Fase 3 — FE panel

1. Rutas bajo `/platform/admin` (o app ops): guard `RequirePlatformAdmin` (sesión + claim; 404 genérico si no).
2. UI MVP: tabla tenants → detalle con tabs (Citas / Servicios / Imágenes / Historial).
3. Acciones: toggle Pro, ban, editar/borrar entidades vía Admin API (nunca client service_role).
4. Tests de utils puros (parseo claims, guards); **no** importar client real en unit tests (regla del repo).
5. `pnpm verify` + `tsc -b`.

### Fase 4 — Hardening

1. Rate limit / lockout en function.
2. Alertas email en acciones críticas.
3. Separar deploy del bundle admin si aún está mezclado.
4. Runbook: “cómo añadir un segundo admin”, “cómo rotar Access”, “cómo revocar”.

### Criterios de aceptación MVP

- [ ] Usuario no-admin recibe 403 en Admin API y no ve datos globales.
- [ ] Sin pasar Cloudflare Access no carga ops (si se adoptó A1).
- [x] Owner no puede ponerse `is_pro=true` por API directa.
- [ ] Ban impide login y oculta/bloquea página pública del tenant.
- [ ] Toggle Pro y ban quedan en `admin_audit_log`.
- [ ] No hay `service_role` ni secretos admin en el frontend.

---

## 6. Decisiones (estado)

1. **¿Dónde vive el panel?** → **Repo nuevo** (SPA aparte). No dentro de `app.fastbook.es`.
2. **¿Deploy?** → **No** (localhost). Si se publica más adelante → volver a Capa A (Access / `ops.*`).
3. **¿Cómo habla con Supabase en local?** → **BFF local** con `service_role` (proxy Vite). No meter service role en el bundle.
4. **¿Ban?** → Auth ban + flag en `tenants` (migración en repo `fastbook`).
5. **¿Impersonación?** → No en MVP.

Detalle ejecutable: [`admin-panel-handoff.md`](./admin-panel-handoff.md).

---

## 7. Resumen ejecutivo

**Repo admin (nuevo):** scaffold + tokens CSS + BFF + pantallas MVP (ver handoff).

**Repo fastbook (este):** migraciones `is_pro` protegido + ban (+ audit opcional); la app pública/enterprise debe respetar ban.

**No negociable:** MAC no es control web; localhost reduce exposición del front pero el `service_role` y el cierre de RLS/`is_pro` siguen siendo la frontera real.
`)