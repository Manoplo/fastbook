# `send-booking-confirmation`

Edge Function: emails vía **Resend** tras crear una reserva.

1. **Cliente** — confirmación + QR (CID) + enlace de check-in.
2. **Tenant (owner)** — aviso de nueva reserva (free y Pro) al email de `auth.users` del `tenants.owner_id`. Sin QR. Si no hay owner/email, se omite sin fallar.

URL: `https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-confirmation`  
`verify_jwt = false`

## Cómo se dispara (actual)

Tras un `INSERT` OK, el FE llama:

```ts
supabase.functions.invoke('send-booking-confirmation', {
  body: { checkInToken },
})
```

(`create-booking.ts`, fire-and-forget: un fallo de email no rompe la reserva).

También acepta webhook INSERT / `{ bookingId }` con secret (opcional).

## Destinatarios

| Destino | Fuente | Idempotency key |
|---|---|---|
| Cliente | `bookings.customer_email` | `booking-confirmation/{bookingId}` |
| Negocio | `auth.users.email` del `tenants.owner_id` | `tenant-booking-notification/{bookingId}` |

No hace falta columna extra en `tenants`: el email de login del owner basta. Tenants sin `owner_id` (datos legacy) no reciben el aviso.

## Secrets (Supabase → Edge Functions → Secrets)

| Secret | Valor prod |
|---|---|
| `RESEND_API_KEY` | `re_…` |
| `APP_ORIGIN` | `https://app.fastbook.es` |
| `BOOKING_EMAIL_FROM` | `Fastbook <noreply@mail.fastbook.es>` (o el from verificado en Resend) |
| `BOOKING_CONFIRMATION_WEBHOOK_SECRET` | string largo (solo si usas webhook/curl) |

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase.

## Preview Vercel (`*.vercel.app`) vs `APP_ORIGIN`

- El **email** siempre usa `APP_ORIGIN` → enlaces/QR del mail apuntan a `https://app.fastbook.es/...`
- El **QR en pantalla** usa `window.location.origin` → en preview será `https://fastbook-sepia.vercel.app/...`

No bloquea el envío. Ojo: reservas de preview escriben en la **misma** BBDD y mandan mails reales (usa tu email al probar).

## Prueba manual

```bash
curl -i -X POST \
  'https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-confirmation' \
  -H 'Authorization: Bearer <BOOKING_CONFIRMATION_WEBHOOK_SECRET>' \
  -H 'Content-Type: application/json' \
  -d '{"bookingId":"<uuid>"}'
```

Respuesta OK incluye `tenantNotification`: `{ status: "sent" | "skipped" | "failed", ... }`.
