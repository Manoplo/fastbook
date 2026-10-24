# `send-booking-confirmation`

Edge Function: email de confirmación de reserva vía **Resend**, con QR (CID) + enlace de check-in.

URL: `https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-confirmation`  
`verify_jwt = false` — la auth es un secret propio (webhook / prueba manual).

## Secrets (Dashboard → Edge Functions → Secrets)

| Secret | Obligatorio | Ejemplo |
|---|---|---|
| `RESEND_API_KEY` | sí | `re_…` (API key de Resend) |
| `APP_ORIGIN` | sí | `http://localhost:5173` o URL de prod |
| `BOOKING_CONFIRMATION_WEBHOOK_SECRET` | sí | string largo aleatorio |
| `BOOKING_EMAIL_FROM` | no | `Fastbook <onboarding@resend.dev>` (tests) o `Fastbook <noreply@tudominio.com>` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase.

## Disparo recomendado: Database Webhook

Dashboard → Database → Webhooks → Create:

- Table: `bookings`
- Events: **Insert**
- URL: la de la function arriba
- HTTP Headers:
  - `Authorization` = `Bearer <mismo valor que BOOKING_CONFIRMATION_WEBHOOK_SECRET>`
  - `Content-Type` = `application/json`

## Prueba manual

```bash
curl -i -X POST \
  'https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-confirmation' \
  -H 'Authorization: Bearer <BOOKING_CONFIRMATION_WEBHOOK_SECRET>' \
  -H 'Content-Type: application/json' \
  -d '{"bookingId":"<uuid-de-una-reserva>"}'
```

Con Resend Free y `onboarding@resend.dev`, el `to` suele tener que ser tu propio email verificado en Resend.

## Payload aceptado

1. Webhook Supabase: `{ "type":"INSERT","table":"bookings","record":{ "id":"…" } }`
2. Manual: `{ "bookingId":"…" }`
