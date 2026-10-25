# Handoff — Fastbook (cierre PR confirmación + QR)

Documento para el siguiente agente. Leer también `.cursor/rules/fastbook.mdc` y `fastbook-roadmap.md`. Storming de referencia: `booking-confirmation-storming.md`.

## Estado al cerrar esta PR

- **Rama:** `feat/qrcode-generator`
- **Prod FE:** [https://fastbook.es](https://fastbook.es) (Vercel; `vercel.json` rewrite SPA)
- **Preview:** `*.vercel.app` (p. ej. `fastbook-sepia.vercel.app`) — misma BBDD/Edge Function que prod
- **App:** React 19 + Vite 8 + TypeScript + React Compiler
- **BBDD:** + `bookings.check_in_token` (migración `20261024000000_booking_check_in_token`)
- **Email:** Edge Function `send-booking-confirmation` (Resend) desplegada; FE la invoca tras crear reserva

## Qué cierra esta PR

1. Token opaco `check_in_token` en `bookings` (unique, not null, default).
2. `createBooking` genera token en cliente, lo inserta y lo devuelve (no hay SELECT público → no `insert().select()`).
3. QR en step 3 (`qrcode.react`) con URL  
   `{origin}/enterprise/{tenantSlug}/check-in/{checkInToken}`.
4. Edge Function Resend: HTML + QR CID + enlace; idempotency `booking-confirmation/{id}`.
5. Tras INSERT OK → `supabase.functions.invoke('send-booking-confirmation', { body: { checkInToken } })` (fire-and-forget).
6. Secrets Supabase (no van en Vercel FE): `RESEND_API_KEY`, `APP_ORIGIN=https://fastbook.es`, `BOOKING_EMAIL_FROM` (p. ej. `Fastbook <noreply@mail.fastbook.es>`), opcional `BOOKING_CONFIRMATION_WEBHOOK_SECRET`.
7. `vercel.json` rewrite para F5 en rutas SPA.

## Archivos clave

```
src/lib/booking-check-in.utils.ts          → token + URL helpers (+ tests)
src/lib/create-booking.ts                  → insert + invoke email
src/components/booking-confirmation/       → QR en confirmación
supabase/migrations/20261024000000_booking_check_in_token.sql
supabase/functions/send-booking-confirmation/  → index / email / utils / README
vercel.json
```

## Pendiente de verificación manual (prod)

- DNS Resend (`mail.fastbook.es`) + envío real tras deploy a prod.
- Si falla: logs Edge Function + Resend dashboard. El QR en pantalla no depende del email.

## Preview vs prod (email)

| | Preview | Prod |
|---|---|---|
| ¿Manda email? | Sí (mismos secrets) | Sí |
| Enlace/QR del **mail** | `https://fastbook.es/...` (`APP_ORIGIN`) | igual |
| QR en **pantalla** | origin del preview | `fastbook.es` |

Reservas de preview escriben en la misma BBDD y generan mails reales.

## Siguiente trabajo (prioridad #1)

**Validar QR en el dashboard del tenant → marcar llegada / check-in.**

Alcance sugerido:

1. **Modelo de estados en BBDD** (hoy solo `confirmed` \| `cancelled`; UI deriva `in_progress` / `completed` por hora). Decidir p. ej.:
   - `checked_in_at` timestamptz, y/o
   - ampliar `status` (`checked_in` / `completed` / `no_show` / `cancelled`) — necesario también para métricas después.
2. **UI “Validar QR”** en agenda (botón Stitch aplazado):
   - Cámara web (`getUserMedia` + `BarcodeDetector` / fallback WASM; Safari iOS frágil).
   - Fallback: pegar/teclear token o URL.
3. **Ruta** `/enterprise/:tenantSlug/check-in/:token` (la URL ya está en el QR): owner autenticado → resuelve booking del tenant → check-in → feedback (nombre, servicio, hora).
4. RPC / update con RLS owner (no confiar solo en el token en cliente).
5. Tests de utils de parseo URL / transición de estado (sin tocar `supabase-client` en unit tests).

Fuera de este siguiente slice (salvo que se pida): recordatorios D-1, `.ics`, SMS, reorder galería, `/pricing`.

## Comandos

```bash
pnpm dev
pnpm verify
pnpm exec tsc -b
```

## Notas para el agente

- Responder en **español**.
- No regenerar pantallas/BE sin pedirlo; Stitch + Supabase MCP cuando toque UI/SQL.
- Tras feature: `pnpm verify` + `tsc -b` + actualizar `fastbook-roadmap.md`.
- Commits / deps nuevas solo si se piden.
- Código Edge Function vive en `supabase/functions/` (fuera de `src`; no entra en Vitest/tsc del SPA).

## Archivos de verdad

- Reglas: `.cursor/rules/fastbook.mdc`
- Plan: `fastbook-roadmap.md`
- Storming email/QR: `booking-confirmation-storming.md`
- Function README: `supabase/functions/send-booking-confirmation/README.md`
- Este handoff: `handoff.md`
