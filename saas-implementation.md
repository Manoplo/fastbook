# Fastbook SaaS — Handoff de implementación (Stripe)

> Documento para el agente implementador. Leer antes: `.cursor/rules/fastbook.mdc` (convenciones FE), `fastbook-roadmap.md` (estado), `handoff.md`.
> Redactado el 2026-10-29. Los datos de Stripe provienen de la documentación oficial a esa fecha: **verifica nombres de campos/eventos contra `docs.stripe.com` o con `stripe_api_details` antes de codificar** (la API de Stripe cambia por versión).

---

## 0. TL;DR

Dos flujos de dinero **independientes**. No mezclarlos en el mismo código ni en la misma cuenta de Stripe lógica.

| | Flujo A — Suscripción Pro | Flujo B — Cobro de reservas |
|---|---|---|
| Quién paga | Tenant → Fastbook | Reservador (cliente final) → Tenant |
| Tipo | Recurrente, cancelable | Pago único por reserva |
| Stripe | Billing: Checkout `mode=subscription` + Customer Portal | Connect: Checkout `mode=payment` en la cuenta del tenant |
| Cuenta Stripe | Cuenta de plataforma de Fastbook | Cuenta conectada (Express) del tenant |
| Fuente de verdad en BBDD | `tenants.is_pro` (derivado de `subscriptions`) | `bookings.payment_status` |
| Prioridad | **Fase 1–2 (hacer primero)** | Fase 3 (después, requiere Pro) |

Arquitectura: **no hay backend propio**. Todo el lado servidor son **Supabase Edge Functions (Deno)** + Postgres + RLS. Stripe habla con nosotros **solo por webhooks**; el FE nunca decide si alguien es Pro.

Regla de oro: **el webhook es la única vía que escribe el estado de pago/plan**. La redirección de vuelta desde Checkout (`success_url`) solo sirve para UX, nunca para conceder acceso.

---

## 1. Estado actual del repo (relevante)

- Stack: React 19 + Vite + TS, Supabase (proyecto `fastbook`, `ptgltexbfxjqmyozcavt`, `eu-west-1`). Edge Functions existentes: `send-booking-confirmation`, `send-booking-reminders` (ambas `verify_jwt=false`; Resend; cron con `pg_cron` + Vault).
- Plan hoy: `tenants.is_pro boolean` (default false). Se activa **a mano** por SQL (ver roadmap).
- Features Pro ya implementadas y gateadas por `is_pro`: >2 servicios, galería de imágenes + YouTube, personalización de marca, recordatorio D-1 al cliente. Límites free: `FREE_MAX_SERVICES` en `src/widgets/enterprise-schedules/enterprise-schedules.utils.ts`.
- `src/lib/feature-flags.ts` → `hasSaasImplementation = false` ("cobro online a clientes"). Usarlo como kill-switch de la UI nueva hasta lanzar.
- `UpgradeProModal` enlaza a `/pricing`, ruta **inexistente**. `/enterprise/:tenantSlug/settings` es placeholder (buen sitio para "Facturación").
- Tablas: `tenants`, `services` (tiene `price numeric(10,2)`), `bookings`, `tenant_availability`. `bookings.status` check: `confirmed|cancelled`.
- Reserva pública: `createBooking` inserta directamente desde el navegador con la anon key (policy `public insert bookings`: `status='confirmed'` + servicio activo del tenant). Sin SELECT público en `bookings`.
- Tests: Vitest; **nunca** importar en un test módulos que inicialicen `supabase-client` (extraer lógica pura a `*.utils.ts`). CI sin `.env.local`.

### ⚠️ Hallazgos de seguridad que bloquean el lanzamiento (arreglar en Fase 0)

1. **El owner puede auto-concederse Pro.** `20260930000000_tenant_auth.sql` define `owner update tenants` (`using owner_id = auth.uid()`, sin restricción de columnas) → desde la consola del navegador: `supabase.from('tenants').update({is_pro:true})`. Solución: mover los campos de facturación fuera de `tenants` (tabla `subscriptions`, sin policies de escritura para `authenticated`) y hacer que `is_pro` solo lo cambie `service_role`. Opciones: (a) `revoke update (is_pro, stripe_*) on public.tenants from authenticated` + grant por columna del resto, o (b) trigger `before update` que rechace cambios de `is_pro` si `auth.role() <> 'service_role'`. Recomendado (b) por ser robusto ante nuevas columnas, o (a) con lista blanca explícita. Verificar con un test SQL manual.
2. **Enforcement Pro solo en UI** (roadmap lo reconoce: branding, límite de 2 servicios, imágenes). Un free puede insertar un 3.er servicio vía API. Añadir triggers/RLS `with check` que consulten `is_pro` (ver §8).
3. **`unique (service_id, booking_date, start_time)` incluye reservas canceladas** → una reserva cancelada bloquea el hueco para siempre. Esto ya es un bug y será crítico con pagos pendientes/expirados. Sustituir por índice único parcial `where status in ('confirmed','pending_payment')`.
4. **Anon key hardcodeada en migración** `20261027180100_booking_reminder_cron.sql` (es la publishable/anon, no es secreto grave, pero no repetir el patrón con claves de Stripe: **jamás** claves de Stripe en migraciones, repo, `VITE_*` ni Vercel).

---

## 2. Modelo de negocio propuesto (decisiones a confirmar con el owner)

Marcado ✅ = recomendación por defecto si el owner no responde; ❓ = confirmar.

- ✅ Un único plan **Pro** con 2 precios (mensual y anual con descuento). Moneda **EUR**, mercado España/UE.
- ❓ Precio. Por defecto: mensual X €, anual ≈ 10×mensual. No hardcodear: viven en Stripe (Price IDs en secrets/config).
- ✅ **Trial** opcional de 14 días sin tarjeta (`trial_period_days` + `payment_method_collection: 'if_required'`). ❓ confirmar si se quiere.
- ✅ IVA: usar **Stripe Tax** si el owner lo activa (ver §11); si no, precios con IVA incluido.
- ✅ Features Pro: las ya existentes + **cobro de reservas** (flujo B). ❓ ¿Comisión de plataforma por reserva cobrada (`application_fee`)? Por defecto **0 %** al inicio (solo suscripción); dejar el parámetro configurable.
- ✅ Cancelación = **al final del periodo pagado** (no prorrateo ni reembolso automático). Al cancelar: sigue Pro hasta `current_period_end`, luego degrada a free **sin borrar datos** (ver §7).

---

## 3. ¿Se puede hacer vía MCP? (viabilidad)

**Sí, la parte de configuración/operación; no el runtime.** MCP es herramienta del agente en tiempo de desarrollo, no sustituye código que corre en producción.

### 3.1 Stripe MCP (`https://mcp.stripe.com`, remoto, Streamable HTTP)

Alta en Claude Code:
```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
# luego /mcp para autenticar por OAuth (elegir SANDBOX/test mode)
```
Alternativa no interactiva: **agent API key** como bearer en `.mcp.json` leyendo una env var (nunca pegarla en el comando ni commitearla). Atajo oficial: `npm i -g @stripe/cli && stripe agent setup`.

> ⚠️ Fecha límite: **a partir de diciembre de 2026 el MCP deja de aceptar secret keys completas y restricted keys sin la etiqueta "Agent"**. Usar OAuth o agent API keys.

Herramientas relevantes (según docs a 2026-10-29): `stripe_api_search`, `stripe_api_details`, `stripe_api_read`, `stripe_api_write` (acceso genérico a casi toda la API), `get_stripe_account_info`, `search_stripe_documentation`, `stripe_implementation_planner`, `stripe_analytics`.
Métodos soportados vía `stripe_api_write` que necesitamos: crear **products**, **prices**, **coupons/promotion codes**, **webhook endpoints** (y event destinations), **customer portal configurations**, checkout sessions, subscriptions (create/update/cancel), refunds, **test clocks** (simular renovaciones/impagos), tax settings/registrations. Los reembolsos y pagos salientes requieren **confirmación humana** (URL de aprobación).

Qué hacer **por MCP** (una sola vez, en sandbox primero, luego repetir en live):
1. Crear Product "Fastbook Pro" + 2 Prices recurrentes (mensual/anual, EUR). Guardar los `price_...` IDs.
2. Crear la **configuración del Customer Portal** (ver §5.3).
3. Crear el **webhook endpoint** de cuenta (apunta a la Edge Function `stripe-webhook`) y, para Connect, un segundo endpoint con `connect: true` (apunta a `stripe-connect-webhook`). La respuesta de creación incluye el `secret` (`whsec_...`) **una sola vez**.
4. Tests end-to-end con **test clocks** y tarjetas de prueba (ver §12).

Qué **NO** hacer por MCP / limitaciones:
- No usar MCP desde producción ni desde las Edge Functions: ahí se usa el SDK `stripe` con la secret key.
- **Seguridad de secretos:** cualquier valor que devuelva el MCP (p. ej. `whsec_...`) pasa por el contexto del modelo. Es aceptable en **sandbox**; en **live** el owner debe crear el webhook y guardar secretos él mismo (Dashboard + `supabase secrets set`) o rotar el secreto después. No pegar claves live en el chat.
- **Con cuentas conectadas, MCP no soporta OAuth**: requiere agent API key de plataforma + header `Stripe-Account: acct_...`. Para el desarrollo basta con sandbox.
- La activación de Connect (perfil de plataforma, aceptar términos, branding del onboarding) y la verificación KYC se hacen en el **Dashboard**, no por API/MCP.
- Prompt injection: activar aprobación manual de herramientas; no combinar el MCP de Stripe con fuentes de texto no confiables.

### 3.2 Supabase MCP (ya conectado como `supabase-hosted`)

Cubre todo el lado servidor sin backend propio:
- `apply_migration` / `execute_sql` / `list_migrations` → esquema (guardar **también** cada migración como fichero en `supabase/migrations/` con el mismo timestamp que devuelva `list_migrations`, como se hizo hasta ahora).
- `deploy_edge_function` / `get_edge_function` / `list_edge_functions` → desplegar `stripe-*` (el código fuente vive en `supabase/functions/<nombre>/` y debe coincidir con lo desplegado).
- `create_edge_function_secret` → guardar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY/YEARLY`. Misma advertencia: para live preferir `supabase secrets set` por el owner.
- `query_logs` → depurar webhooks; `get_advisors` → revisar RLS tras migrar; `generate_typescript_types` → regenerar `src/lib/database.types.ts`.
- `create_branch` (si el plan lo permite) para probar migraciones sin tocar prod. El proyecto tiene datos reales (1 tenant, 8 bookings): migraciones **aditivas y reversibles**.

### 3.3 Conclusión
Flujo recomendado para el agente: **Stripe MCP (sandbox) para catálogo/webhooks/portal + Supabase MCP para esquema/funciones/secrets + código TS en el repo**. Todo el runtime = Edge Functions + SDK de Stripe.

---

## 4. Arquitectura sin BE (Edge Functions)

```
Browser (SPA Vite)
  │  supabase.functions.invoke(...)  (JWT del owner)           ┌───────────────┐
  ├────────────────────────────────────────────────────────────▶ Edge Functions │──▶ Stripe API (SDK, secret key)
  │                                                             │  (Deno)       │
  │  redirect a Stripe-hosted Checkout / Portal                 └──────▲────────┘
  └──▶ Stripe ──── webhook firmado ─────────────────────────────────────┘
                                         └─▶ service_role → Postgres (RLS bypass, único escritor de plan/pago)
```

### Edge Functions nuevas (convención: carpeta con `index.ts` + `utils.ts` + `utils.test.ts` + `README.md`, como las existentes)

| Función | `verify_jwt` | Auth | Qué hace |
|---|---|---|---|
| `stripe-create-checkout-session` | **true** | JWT owner | Valida owner del tenant, crea/recupera Stripe Customer, crea Checkout `mode=subscription`, devuelve `url`. |
| `stripe-create-portal-session` | **true** | JWT owner | Crea sesión del Customer Portal (gestionar tarjeta, cambiar plan, **cancelar**, ver facturas). Devuelve `url`. |
| `stripe-webhook` | **false** (Stripe no envía JWT) | Firma `Stripe-Signature` | Eventos de la cuenta de plataforma (Flujo A). |
| `stripe-connect-onboard` | true | JWT owner | Crea cuenta conectada + Account Link / login link (Flujo B). |
| `stripe-create-booking-checkout` | **false** (reservador anónimo) | rate-limit + validación | Crea reserva `pending_payment` + Checkout en cuenta conectada (Flujo B). |
| `stripe-connect-webhook` | **false** | Firma (secreto de Connect) | Eventos de cuentas conectadas (Flujo B). |

Detalles técnicos obligatorios:
- Importar: `import Stripe from 'npm:stripe@<versión fijada>'`. **Fijar `apiVersion`** explícitamente en el cliente (`new Stripe(key, { apiVersion: '...' })`) y la misma versión en el webhook endpoint, para evitar cambios de payload.
- En Deno/Edge **verificar firma con la variante asíncrona**: `await stripe.webhooks.constructEventAsync(rawBody, sigHeader, secret)` y usar `Stripe.createFetchHttpClient()` (el cliente por defecto usa `http` de Node). Leer el body con `await req.text()` **sin parsear antes** (la firma es sobre el raw body).
- `service_role` solo dentro de funciones; mismo patrón de `createClient` que `send-booking-confirmation/index.ts`.
- Funciones con JWT: obtener el usuario con `supabase.auth.getUser(token)` y comprobar que es `owner_id` del tenant pedido (no confiar en `tenantId` del body).
- CORS: copiar `corsHeaders()` de las funciones existentes; el `success_url`/`cancel_url`/`return_url` se construyen **en servidor** desde el secret `APP_ORIGIN` (ya existe), nunca desde el body (open redirect).
- **Idempotencia:** `Idempotency-Key` en cada POST a Stripe que cree objetos (patrón ya usado en Resend: `booking-confirmation/{id}`).
- Los webhooks de Stripe reintentan hasta 3 días y pueden llegar **duplicados y desordenados**: ver §6.4.

---

## 5. Flujo A — Suscripción recurrente y cancelable (Pro)

### 5.1 Esquema (migración nueva, aditiva)

```sql
-- Mapeo tenant ↔ Stripe Customer (1:1). Sin escritura desde el cliente.
create table public.billing_customers (
  tenant_id          uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at         timestamptz not null default now()
);

-- Estado de la suscripción (espejo de Stripe; solo lo escribe el webhook).
create table public.subscriptions (
  stripe_subscription_id text primary key,
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  status                 text not null,   -- trialing|active|past_due|canceled|unpaid|incomplete|incomplete_expired|paused
  price_id               text not null,
  cancel_at_period_end   boolean not null default false,
  current_period_end     timestamptz,     -- ojo: en versiones recientes de la API vive en subscription.items[].current_period_end
  trial_end              timestamptz,
  canceled_at            timestamptz,
  stripe_event_created   timestamptz not null, -- para ignorar eventos antiguos (ver 6.4)
  updated_at             timestamptz not null default now()
);
create index on public.subscriptions (tenant_id);

-- Registro de eventos procesados (idempotencia de webhooks).
create table public.stripe_events (
  id           text primary key,         -- evt_...
  type         text not null,
  account      text,                      -- acct_... si viene de Connect
  processed_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.stripe_events     enable row level security;
-- Lectura: el owner puede LEER su propia suscripción (para mostrar estado en Ajustes).
create policy "owner read subscriptions" on public.subscriptions
  for select to authenticated using (private.is_tenant_owner(tenant_id));
-- Sin policies de insert/update/delete: solo service_role escribe. stripe_events y billing_customers: sin policies.
```
> `private.is_tenant_owner` es el helper actual (ver migraciones `20260930*`). Comprueba el nombre/schema real con `list_tables`/`execute_sql` antes de usarlo; las migraciones de 2026-10-12 lo referencian como `private.is_tenant_owner`.

**`tenants.is_pro` se mantiene** (el FE y la RPC de recordatorios ya lo usan) pero pasa a ser **columna derivada**, escrita solo por `service_role` desde el webhook (y protegida, ver §1.1). Función de derivación en TS del webhook:

```
isProFromStatus(status, currentPeriodEnd, now):
  trialing, active           → true
  past_due                   → true  (periodo de gracia mientras Stripe reintenta cobros; ver 5.5)
  canceled, unpaid, incomplete_expired, incomplete, paused → false
  cancel_at_period_end=true y status=active → true hasta que llegue customer.subscription.deleted
```
Extraer esto a `utils.ts` con tests unitarios (es la lógica más crítica del sistema).

### 5.2 Alta (checkout)

1. FE: botón "Hazte Pro" (en `UpgradeProModal` → reemplazar el `<Link to="/pricing">` y en Ajustes → Facturación). Llama `supabase.functions.invoke('stripe-create-checkout-session', { body: { tenantId, interval: 'month'|'year' } })`.
2. Edge Function: verifica owner → busca/crea `billing_customers` (Stripe Customer con `metadata.tenant_id`, email del owner) → crea Checkout Session:
   - `mode: 'subscription'`, `line_items: [{ price: PRICE_ID_segun_interval, quantity: 1 }]`
   - `customer`, `client_reference_id: tenantId`, `subscription_data: { metadata: { tenant_id } , trial_period_days? }`
   - `allow_promotion_codes: true`, `billing_address_collection: 'required'`, `tax_id_collection: { enabled: true }` (B2B con CIF/VAT), `automatic_tax: { enabled: true }` si hay Stripe Tax.
   - `success_url: ${APP_ORIGIN}/enterprise/${slug}/settings?billing=success`, `cancel_url: ...?billing=cancelled`
   - **Validar el interval contra una lista blanca**; el Price ID sale de secrets, no del cliente.
   - Evitar doble suscripción: si ya hay una `active|trialing|past_due` para el tenant → no crear Checkout, devolver URL del Portal.
3. FE: `window.location.href = url`.
4. Al volver (`?billing=success`): mostrar "Procesando tu pago…" y **consultar** `subscriptions`/`tenants.is_pro` con TanStack Query (`refetchInterval` corto, máx. ~30 s). El webhook puede tardar unos segundos. **No** marcar Pro desde la URL.

### 5.3 Gestión y cancelación (Customer Portal)

**La cancelación NO se implementa a mano**: se delega al **Stripe Customer Portal**. Una función `stripe-create-portal-session` devuelve la URL (`return_url = APP_ORIGIN/enterprise/{slug}/settings`).

Configuración del portal (se crea una vez, por MCP `customer_portal/configurations`):
- `subscription_cancel: { enabled: true, mode: 'at_period_end', cancellation_reason: { enabled: true, options: [...] } }` → cancelación al final del periodo (recomendado) y recogemos el motivo.
- `subscription_update`: permitir cambiar entre mensual/anual (lista de prices permitidos, `proration_behavior: 'create_prorations'`).
- `payment_method_update: enabled`, `invoice_history: enabled`, `customer_update` (email/dirección/tax id).
- Headline y enlaces a términos/privacidad de Fastbook.
- Opcional: permitir "reanudar" una suscripción marcada para cancelar (en el portal aparece "Renew plan" mientras `cancel_at_period_end=true`).

UX en Ajustes → Facturación según `subscriptions`:
| Estado | Mostrar |
|---|---|
| sin suscripción | Plan Free + CTA "Hazte Pro" |
| `trialing` | "Prueba hasta {trial_end}" + botón Gestionar |
| `active`, `cancel_at_period_end=false` | "Pro · renueva el {current_period_end}" + Gestionar |
| `active`, `cancel_at_period_end=true` | "Pro hasta {current_period_end} — no se renovará" + botón **Reanudar** (portal) |
| `past_due` | Banner rojo "No hemos podido cobrar, actualiza tu tarjeta" + botón (portal) |
| `canceled` | "Plan Free" + CTA recontratar |

### 5.4 Ciclo de vida: webhooks de la cuenta de plataforma (`stripe-webhook`)

Suscribir **solo** estos eventos (menos superficie = menos bugs):

| Evento | Acción |
|---|---|
| `checkout.session.completed` (`mode=subscription`) | Enlazar `customer` ↔ tenant (`client_reference_id`) si no existe; hacer `subscriptions.retrieve` y hacer upsert (no confiar solo en el payload del evento). |
| `customer.subscription.created` / `.updated` | Upsert en `subscriptions` + recalcular `tenants.is_pro`. Cubre renovación, cambio de plan, `cancel_at_period_end`, trial→active, active→past_due. |
| `customer.subscription.deleted` | `status=canceled`, `is_pro=false`. Se dispara al terminar el periodo tras cancelar, o al agotar reintentos. |
| `invoice.paid` | Opcional: log / email de recibo (Stripe ya envía recibos si se activa en Dashboard). |
| `invoice.payment_failed` | Marcar aviso al owner (email Resend: "actualiza tu método de pago", con enlace al portal). El estado real lo trae `subscription.updated` → `past_due`. |
| `customer.subscription.trial_will_end` | Email de aviso 3 días antes (si hay trial). |

Opcional recomendable: `charge.dispute.created` → alerta interna.

### 5.5 Reintentos e impagos (dunning)
Activar en Dashboard: **Billing → Revenue recovery → Smart Retries** (o ~4 reintentos en 3 semanas) y emails de recordatorio de Stripe. Política Fastbook: durante `past_due` el tenant **mantiene Pro** (gracia); si el estado pasa a `unpaid`/`canceled` → `is_pro=false`. Definir la acción final en Dashboard: "cancelar suscripción" tras agotar reintentos.

---

## 6. Webhooks: reglas de implementación (críticas)

1. **Verificar firma siempre** (`constructEventAsync`); si falla → `400`. Responder `2xx` rápido (< ~10 s); si hay trabajo pesado, hacerlo tras persistir el evento.
2. **Idempotencia:** `insert into stripe_events (id, type) values (evt.id, evt.type) on conflict do nothing returning id`; si no devuelve fila → ya procesado → responder `200` sin hacer nada.
3. **Errores:** si el procesado falla → `500` (Stripe reintenta). Borrar la fila de `stripe_events` o insertarla **al final** en la misma transacción lógica, para no marcar como procesado un evento que falló. Preferible: hacer upserts idempotentes por naturaleza (clave `stripe_subscription_id`) y registrar el evento al terminar.
4. **Desorden:** no asumir orden. En `subscriptions` solo actualizar si `event.created >= stripe_event_created` almacenado; o mejor, ante cualquier evento de suscripción **re-leer** la suscripción de Stripe (`subscriptions.retrieve`) y guardar su estado actual (fuente de verdad = API, el evento es solo "disparador").
5. Un tenant ↔ un customer; resolver tenant por `customer` → `billing_customers`, con fallback a `metadata.tenant_id`.
6. Estructura sugerida: `index.ts` (HTTP + firma + dispatch), `handlers.ts`, `utils.ts` (`isProFromStatus`, mapeos, **puros y testeados**), `utils.test.ts`.
7. Logs sin datos personales ni claves (`console.error('stripe-webhook', evt.id, evt.type, err)`).

---

## 7. Degradación al perder Pro (¿qué pasa con los datos?)

Principio: **nunca borrar datos del cliente** por impago/cancelación; solo dejar de **mostrar/permitir** features.

| Feature | Al pasar a free |
|---|---|
| Servicios > 2 | Seguir existiendo, pero solo los 2 primeros activos públicamente; el resto `active=false` **automáticamente** (job en el webhook al degradar, orden por `created_at`) o simplemente bloquear creación/edición. Decisión recomendada: no desactivar automáticamente, solo impedir crear nuevos y mostrar aviso. ❓ confirmar con owner. |
| Galería/YouTube | La página pública deja de mostrarlas (patrón `resolvePublicBranding` análogo); datos y Storage intactos. |
| Branding | Ya se aplica solo si `is_pro` en la página pública. |
| Recordatorios D-1 | `claim_due_booking_reminders` ya filtra por `t.is_pro`. Nada que hacer. |
| Cobro de reservas (flujo B) | Se desactiva `tenants.booking_payments_enabled`; las reservas pendientes de pago en curso se dejan expirar; las pagadas no se tocan. |

---

## 8. Enforcement server-side de Pro (no solo UI)

Añadir en la misma fase (migración separada):
- Trigger `before insert` en `services`: si el tenant no es Pro y ya tiene ≥ `2` servicios activos → `raise exception`.
- Trigger `before insert or update` en `services`: si no es Pro y `image_urls`/`youtube_url`/`image_url` no vacíos → rechazar.
- Policies de Storage (`service-images`, `tenant-branding`): `with check` que requiera `tenants.is_pro` del tenant del path.
- Constante única del límite free compartida por convención con `FREE_MAX_SERVICES` (comentar en ambos lados).
- Mantener la UI actual como primera barrera (UX), el servidor como segunda (seguridad).

---

## 9. Flujo B — Los tenants cobran las reservas (modo Pro)

### 9.1 Modelo de dinero (decisión de arquitectura)

Fastbook **no debe tocar el dinero de las reservas** salvo que quiera ser marketplace/procesador (implica responsabilidad regulatoria, KYC, impuestos, disputas). Usar **Stripe Connect** con **cuentas Express** (Stripe aloja onboarding/KYC y dashboard del tenant).

Tipo de cargo recomendado: **Direct charges** (el tenant es el comerciante del pago).
- Docs de Stripe: es el modelo para plataformas SaaS donde "las cuentas conectadas transaccionan directamente con sus clientes".
- Reembolsos y contracargos **debitan el saldo del tenant**, no el de Fastbook (menor riesgo para la plataforma).
- Comisión opcional con `payment_intent_data.application_fee_amount` (por defecto 0).
- Requiere capability `card_payments` activa en la cuenta conectada.
- Alternativa descartada: *destination charges* (el cobro vive en la plataforma → refunds/disputas debitan el saldo de Fastbook y Fastbook queda como responsable frente al cliente final). Reconsiderar solo si Fastbook quiere ser el merchant visible.
- ⚠️ **Verificar en docs vigentes** el tipo de cuenta a crear (la doc actual distingue cuentas "legacy v1 Express/Custom" y **v2 accounts**; para direct charges recomienda v2). Usar `stripe_implementation_planner` / `search_stripe_documentation` para fijar el modelo exacto antes de codificar, y comprobar disponibilidad en España.

### 9.2 Onboarding del tenant

1. Ajustes → "Cobros online": solo visible si `is_pro` y `hasSaasImplementation`.
2. `stripe-connect-onboard` (JWT owner): crea la cuenta conectada (si no hay `tenants.stripe_account_id`), guarda `stripe_account_id`, genera **Account Link** (`type: 'account_onboarding'`, `return_url`/`refresh_url` desde `APP_ORIGIN`) → redirect.
3. Webhook `account.updated` (Connect) → actualizar `tenants.stripe_charges_enabled` / `stripe_details_submitted` / `stripe_payouts_enabled`. Solo con `charges_enabled=true` se permite activar cobros.
4. Botón "Ver mi panel de Stripe" (login link Express) para pagos/payouts/facturas del tenant.

### 9.3 Esquema (migración aditiva)

```sql
alter table public.tenants
  add column stripe_account_id        text unique,
  add column stripe_charges_enabled   boolean not null default false,
  add column stripe_payouts_enabled   boolean not null default false,
  add column booking_payments_enabled boolean not null default false;  -- interruptor del tenant

alter table public.services
  add column payment_mode text not null default 'none'
    check (payment_mode in ('none','deposit','full')),
  add column deposit_amount numeric(10,2);   -- si payment_mode='deposit' (alternativa: deposit_percent)

alter table public.bookings
  drop constraint bookings_status_check,
  add  constraint bookings_status_check
    check (status in ('pending_payment','confirmed','cancelled','expired')),
  add column payment_status text not null default 'not_required'
    check (payment_status in ('not_required','pending','paid','refunded','partially_refunded','failed')),
  add column amount_cents integer,                   -- importe a cobrar (snapshot, EUR cents)
  add column stripe_checkout_session_id text unique,
  add column stripe_payment_intent_id   text unique,
  add column payment_expires_at timestamptz;          -- límite de retención del hueco

-- Corrige el bug de §1.3: cancelled/expired no bloquean el hueco.
alter table public.bookings drop constraint bookings_service_id_booking_date_start_time_key;
create unique index bookings_active_slot_uidx
  on public.bookings (service_id, booking_date, start_time)
  where status in ('pending_payment','confirmed');
```
> Comprobar el nombre real de la constraint única con `execute_sql` (`select conname from pg_constraint where conrelid='public.bookings'::regclass`).
> Importe: guardar en **céntimos enteros** (`round(price*100)`); `services.price` es `numeric`.
> Los precios/importes **se calculan siempre en servidor** a partir de `services`, nunca del body.

**RLS — cerrar el bypass:** la policy `public insert bookings` permite `status='confirmed'` desde anon para cualquier servicio. Con pagos, un reservador podría saltarse el cobro llamando a la API directamente. Cambiar la policy a: `status='confirmed' and exists(service ... and s.payment_mode = 'none')` (reservas gratuitas siguen insertándose desde el cliente como hoy). Las reservas con cobro **solo** se crean desde `stripe-create-booking-checkout` con `service_role`. Cambiar también `createBooking` en FE para bifurcar según `service.payment_mode` (+ `booking_payments_enabled` del tenant).
Exponer públicamente (RLS de `services`/`tenants` ya es lectura pública) solo lo necesario: `payment_mode`, `deposit_amount`; **no** `stripe_account_id` (cuidado: `tenants` tiene `select using (true)` → el `acct_` quedaría público; no es secreto pero se recomienda mover los datos Stripe del tenant a una tabla `tenant_billing` privada en lugar de columnas en `tenants`. **Recomendado**: tabla `tenant_stripe_accounts (tenant_id pk, stripe_account_id, charges_enabled, payouts_enabled)` sin lectura pública, y exponer a la página pública solo un booleano derivado vía vista/RPC `security definer`).

### 9.4 Flujo de reserva con cobro (máquina de estados)

```
              ┌──────────────── (pago expira / cancela) ───────────────┐
              ▼                                                        │
 [slot libre] ──► pending_payment ──(checkout.session.completed)──► confirmed + paid
                       │  hold 15–30 min (payment_expires_at)          │
                       └──(checkout.session.expired | cron limpieza)──► expired
 confirmed+paid ──(tenant/cliente cancela según política)──► cancelled + refunded
```

1. Reservador elige día/hora/servicio/datos. FE llama `stripe-create-booking-checkout` (anónimo) con `{ tenantSlug, serviceId, date, startTime, customer... }`.
2. Función (service_role): valida tenant `booking_payments_enabled` + `charges_enabled`, servicio activo y con `payment_mode != 'none'`, **slot libre** (reusa la comprobación de disponibilidad), calcula `amount_cents`.
3. Inserta `bookings` con `status='pending_payment'`, `payment_status='pending'`, `payment_expires_at = now()+30min`. El índice único parcial **retiene el hueco**; un conflicto `23505` → devolver 409 "hueco ocupado".
4. Crea Checkout Session **en la cuenta conectada**: `stripe.checkout.sessions.create({ mode:'payment', line_items:[price_data{currency:'eur',unit_amount,product_data{name:service}}], customer_email, client_reference_id: booking.id, metadata:{booking_id}, payment_intent_data:{ application_fee_amount?, metadata:{booking_id}}, expires_at: now+30min, success_url, cancel_url }, { stripeAccount: acct_id, idempotencyKey: 'booking-checkout/'+booking.id })`. Guarda `stripe_checkout_session_id`. Devuelve `url`.
   - `expires_at` mínimo de Stripe: 30 min → alinear `payment_expires_at` con él.
5. Webhook Connect (`event.account` = acct del tenant):
   - `checkout.session.completed` con `payment_status='paid'` → `bookings`: `confirmed`, `paid`, guardar `payment_intent`; **entonces** invocar `send-booking-confirmation` (hoy lo dispara el FE al crear; en este flujo debe dispararlo el webhook, porque el FE aún no sabe si pagó).
   - `checkout.session.expired` → `expired` + `payment_status='failed'` (libera hueco).
   - `checkout.session.async_payment_succeeded/failed` solo si se habilitan métodos asíncronos (SEPA/Bizum no aplica; empezar solo con tarjeta/wallets).
   - `charge.refunded` → `payment_status='refunded'|'partially_refunded'`.
   - `account.updated` → flags de onboarding.
   - `charge.dispute.created` → marcar y avisar al tenant.
6. **Red de seguridad:** `pg_cron` cada 5 min (mismo patrón que recordatorios) que pase `pending_payment` con `payment_expires_at < now()` a `expired`, por si se pierde un webhook.
7. Pantalla de retorno `/:tenantSlug?payment=success&b={token}` muestra "Confirmando pago…" y consulta el estado de la reserva (hoy no hay SELECT público en `bookings`; usar RPC `security definer` `get_booking_status(check_in_token)` que devuelva solo `status`/`payment_status`). El QR/confirmación solo se muestra cuando `confirmed`.

### 9.5 Política de cancelación/reembolso de reservas
- Configurable por tenant (`cancellation_window_hours`, p. ej. 24 h). ❓ confirmar alcance en v1: recomendado **solo reembolso manual por el tenant desde su panel Express de Stripe** + webhook `charge.refunded` para reflejarlo. Reembolso automático al cancelar = fase posterior.
- Cuando el tenant cancela desde la agenda una reserva pagada → botón "Cancelar y reembolsar" → función owner que crea `refund` en la cuenta conectada (`reverse_transfer` no aplica en direct charges; con direct charges el `application_fee` se reembolsa con `refund_application_fee: true`).

### 9.6 Qué cobra Fastbook en este flujo
Por defecto nada. Opciones futuras: `application_fee_amount` fijo/porcentual. Las comisiones de Stripe las asume el tenant (en direct charges se puede elegir quién paga; por defecto el tenant). Reflejarlo en `/pricing` y en los términos.

---

## 10. Cambios de FE (siguiendo `fastbook.mdc`)

Convenciones: kebab-case, `@src/`/`@components/` para imports externos a la carpeta, `classNames`, sin `useMemo/useCallback`, componentes en su carpeta con `.types.ts`/`.utils.ts`/test colocalizado, TanStack Query para server state. **Usar Stitch MCP antes de la UI** (regla del repo) y **actualizar `fastbook-roadmap.md` al terminar cada fase**.

Lista de trabajo:
- `src/lib/billing.ts` (client Supabase: `startProCheckout`, `openBillingPortal`) + `billing.utils.ts` (mapeo estado→UI, **testeable sin Supabase**).
- `src/lib/use-subscription.ts` (hook TanStack Query sobre `subscriptions`).
- Ruta pública `/pricing` (hoy rota; añadir a `App.tsx` y/o dirigir al landing `fastbook.es/precios` en el repo `fastbook-landing`).
- Ajustes → sección **Facturación** (`widgets/enterprise-billing`).
- Reemplazar `Link to="/pricing"` del `UpgradeProModal` por la acción de checkout cuando `hasSaasImplementation`.
- Badge Pro del header ya usa `is_pro`; añadir estado "Pro hasta …/Cancelado" opcional.
- Flujo B: `services-catalog` (campo modo de cobro/importe), onboarding Connect en Ajustes, bifurcación en `createBooking`, step de "Pagar" y pantalla de retorno.
- Regenerar `database.types.ts` tras cada migración (`generate_typescript_types`).
- Variables FE nuevas: **ninguna secreta**. (Opcional `VITE_STRIPE_PUBLISHABLE_KEY` solo si se usa Elements; con Checkout alojado no hace falta.)

---

## 11. Consideraciones extra

**Legal / fiscal (España/UE)**
- Hacen falta páginas de **Términos**, **Privacidad** (RGPD: Stripe como encargado/corresponsable), **política de cancelación y reembolsos** y aviso de renovación automática (obligación de información clara antes del cobro recurrente).
- IVA: Stripe Tax (calcula y recauda; requiere registrar jurisdicciones; configurable por MCP `tax/settings`/`registrations`) o precios IVA incluido + facturas de Stripe. B2B UE: recoger NIF-IVA (`tax_id_collection`). Decisión del owner con su gestor.
- Cada tenant es responsable de **su** IVA/facturación hacia el reservador en el flujo B (Fastbook no emite esas facturas). Dejar claro en términos.
- **SCA/3-D Secure**: Checkout alojado lo gestiona; no implementar tarjetas a mano.
- Reservadores: informar de cargo y política de cancelación antes de pagar; cumplir derecho de desistimiento aplicable a servicios con fecha concreta (consultar).
- Cookies: Stripe Checkout alojado va en dominio de Stripe; si luego se usa Elements/Stripe.js, revisar `cookie-banner`.

**Seguridad**
- Secretos solo en Supabase secrets (Edge) — nunca en `.env*` de FE, Vercel, migraciones, ni commits. Añadir `STRIPE_*` a `.env.example` **solo como comentarios sin valor** y documentarlos en README de las funciones.
- Claves: usar **claves restringidas / agent keys** con permisos mínimos; rotar si se filtran; modo test y live con proyectos/secretos separados (idealmente rama de Supabase o proyecto de staging para live ≠ test).
- Rate-limiting en `stripe-create-booking-checkout` (anónima): evita que un bot cree miles de `pending_payment` y bloquee agenda. Mitigaciones: límite por IP/email, máximo N pendientes por email/tenant, CAPTCHA (Turnstile) si hay abuso, TTL corto.
- Validar `Origin`/CORS y construir URLs de retorno solo en servidor.
- Auditar RLS al final de cada migración con `get_advisors` (security).

**Entornos y despliegue**
- Dos modos de Stripe: **test (sandbox)** durante todo el desarrollo; paso a **live** = repetir catálogo + webhooks + portal config + secretos live (checklist en §13). Mantener un script/lista reproducible (los IDs de test no valen en live).
- Webhooks en local: `stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook` (requiere Supabase CLI local; sirve `--no-verify-jwt` o `verify_jwt=false` en `config.toml`).
- Preview de Vercel comparte BBDD con prod (ya documentado): **no** habilitar Stripe live desde previews; `APP_ORIGIN` de la función dicta redirecciones.
- Versionar `supabase/config.toml` con `[functions.stripe-webhook] verify_jwt = false` (hoy no hay `config.toml` en el repo; las funciones existentes se desplegaron con `verify_jwt=false` vía MCP). Al desplegar con MCP pasar `verify_jwt` correcto por función (**true** para las de owner).

**Observabilidad y operación**
- Tabla `stripe_events` sirve de auditoría. Alertas de webhooks fallidos desde Dashboard de Stripe (entregas) y `query_logs` de Supabase.
- Dashboard de métricas (MRR, churn) → `stripe_analytics` por MCP o Stripe Dashboard; no construir en FE en v1.
- Soporte: el owner de Fastbook puede ver el estado de un tenant con `select * from subscriptions where tenant_id=...`.
- Comando SQL manual del roadmap (`update tenants set is_pro`) debe **convivir** con Stripe: añadir columna `tenants.pro_override boolean default false` (cortesías/cuentas demo, p. ej. `manoplo`) y calcular `is_pro = override OR isProFromStatus(...)`, para que el webhook no apague a tenants dados de alta manualmente. Actualizar la sección "COMANDOS SQL RECURRENTES" del roadmap.

**Migración de tenants existentes**: hoy 1 tenant (`manoplo`, Pro manual). Marcar `pro_override=true` antes de activar el webhook.

**Datos / borrado**: `on delete cascade` desde `tenants`; al borrar un tenant con suscripción activa → cancelar antes en Stripe (función o proceso manual) para no seguir cobrando. Cuenta Express conectada: no se borra automáticamente.

**Moneda / importes**: EUR, céntimos enteros, un único `currency` por ahora. Mínimo de Stripe ~0,50 €: validar `amount_cents >= 50` antes de ofrecer cobro.

**Hacerlo gradual (feature flag)**: usar `hasSaasImplementation` (hoy `false`) para ocultar toda la UI de pago hasta Fase 2 completa; considerar moverlo a `import.meta.env.VITE_*` o a una tabla de config para activarlo sin deploy.

---

## 12. Plan de fases (cada fase = una PR pequeña; `pnpm verify` + `tsc -b` verdes; actualizar roadmap)

**Fase 0 — Endurecimiento (sin Stripe)**
- [ ] Bloquear auto-edición de `is_pro` (§1.1). Verificar con SQL que un `authenticated` no puede.
- [ ] Índice único parcial de reservas (§1.3), enforcement server-side de límites free (§8).
- [ ] `pro_override` + migración del tenant actual.

**Fase 1 — Infra Stripe (sandbox, por MCP)**
- [ ] `claude mcp add` Stripe, OAuth en **sandbox**.
- [ ] Product/Prices (mensual+anual), config del Customer Portal, webhook endpoint (plataforma).
- [ ] Migración de §5.1; secrets en Supabase; regenerar types.

**Fase 2 — Suscripción Pro (flujo A)**
- [ ] Edge Functions `stripe-create-checkout-session`, `stripe-create-portal-session`, `stripe-webhook` (+ utils + tests Vitest/Deno de `isProFromStatus`, parseo de eventos, idempotencia).
- [ ] FE: Facturación en Ajustes, `/pricing`, `UpgradeProModal` → checkout, estados de §5.3.
- [ ] Emails de impago (Resend) vía webhook.
- [ ] Pruebas con **test clocks** (ver abajo). Activar `hasSaasImplementation` en preview solo cuando verde.

**Fase 3 — Connect y cobro de reservas (flujo B)**
- [ ] Decidir y documentar tipo de cuenta/charge tras `stripe_implementation_planner` (§9.1). Activar Connect en el Dashboard (manual del owner).
- [ ] Migración §9.3, RPC `get_booking_status`, cron de expiración.
- [ ] Funciones `stripe-connect-onboard`, `stripe-create-booking-checkout`, `stripe-connect-webhook`.
- [ ] FE: onboarding, config de cobro por servicio, step de pago, retorno.
- [ ] Reembolso manual reflejado por webhook.

**Fase 4 — Salida a producción**
- [ ] Términos/Privacidad/Cancelación publicados. Stripe Tax decidido.
- [ ] Repetir catálogo/webhooks/portal en **live** (por el owner), secretos live, `APP_ORIGIN` correcto.
- [ ] Prueba real con tarjeta propia (importe mínimo) + cancelación + reembolso.
- [ ] Monitorización de 1.ª semana.

### Pruebas obligatorias (sandbox)
Tarjetas de prueba de Stripe: `4242 4242 4242 4242` (OK), `4000 0000 0000 0341` (se adjunta pero falla al cobrar → past_due), `4000 0025 0000 3155` (3DS). Con **test clocks** avanzar el tiempo para validar: trial→active, renovación mensual, fallo de cobro → past_due → canceled, `cancel_at_period_end` → `deleted` al vencer, reanudar antes de vencer, upgrade mensual→anual con prorrateo. Casos de webhook: evento duplicado, desordenado, firma inválida, evento de otro tenant. Flujo B: hueco retenido, expiración libera hueco, dos reservadores simultáneos, pago tras expirar la reserva (caso carrera: `checkout.session.completed` llega con booking ya `expired` → **reembolsar automáticamente** y avisar).

---

## 13. Checklist de paso a live
1. Cuenta Stripe verificada (datos de empresa, IBAN de payout), Connect activado (si Fase 3).
2. Crear en **live** (no copiar IDs de test): Product/Prices, Portal config (cancelación `at_period_end`), webhooks (plataforma y Connect) con la **misma `apiVersion`** que el código.
3. Secrets live en Supabase: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `APP_ORIGIN=https://app.fastbook.es`.
4. Dunning/Smart Retries y emails de Stripe activados; recibos activados; branding de Checkout/Portal.
5. `hasSaasImplementation = true` (o env), `/pricing` y legales publicados.
6. `get_advisors` sin avisos de seguridad; `is_pro` no editable por owners.
7. Prueba end-to-end real y rollback previsto (`hasSaasImplementation=false` oculta UI; webhooks siguen sincronizando).

---

## 14. Preguntas abiertas para el owner (resolver antes/durante Fase 1)
1. Precios mensual/anual y si hay trial.
2. ¿Comisión de plataforma sobre reservas cobradas (Fase 3)? ¿Cuánto?
3. Política de degradación: ¿desactivar servicios >2 automáticamente o solo bloquear alta?
4. ¿Stripe Tax o IVA incluido? ¿Facturas con datos fiscales del tenant?
5. ¿Reservas con cobro: pago total, depósito o ambos? ¿Política de reembolso (ventana horas)?
6. ¿Métodos de pago para reservadores solo tarjeta/wallets en v1 (recomendado) o SEPA/Bizum?
7. ¿Entorno de staging separado de prod para Stripe live/test?

## 15. Referencias
- Stripe MCP: https://docs.stripe.com/mcp
- Tipos de cargo en Connect: https://docs.stripe.com/connect/charges
- Checkout: https://docs.stripe.com/payments/checkout · Customer Portal: https://docs.stripe.com/customer-management · Webhooks: https://docs.stripe.com/webhooks · Billing/Subscriptions: https://docs.stripe.com/billing/subscriptions/overview
- Supabase Edge Functions + Stripe webhooks: https://supabase.com/docs/guides/functions
- Repo: `supabase/migrations/*`, `supabase/functions/send-booking-*`, `src/lib/create-booking.ts`, `src/widgets/enterprise-schedules/upgrade-pro-modal/`, `src/lib/feature-flags.ts`.
