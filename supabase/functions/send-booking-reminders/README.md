# `send-booking-reminders`

Recordatorio ~24 h antes de la cita vía **Resend** (QR CID + enlace). **Solo tenants `is_pro`.**

URL: `https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-reminders`  
`verify_jwt = false` (auth propia: Bearer = secret de Vault `booking_reminder_cron_secret`)

## Disparo

`pg_cron` cada **15 minutos** → `pg_net.http_post` → esta function.

La function:

1. Verifica el Bearer con `verify_booking_reminder_cron_secret`.
2. Llama `claim_due_booking_reminders` (Pro + `reminder_sent_at is null` + ventana 23–24 h, `Europe/Madrid`).
3. Envía email Resend (`Idempotency-Key: booking-reminder/{id}`).
4. Si Resend falla → `release_booking_reminder` para reintentar en el siguiente tick.

## Secrets Edge (ya usados por confirmación)

| Secret | Uso |
|---|---|
| `RESEND_API_KEY` | Envío |
| `APP_ORIGIN` | Enlace/QR |
| `BOOKING_EMAIL_FROM` | From |

No hace falta un secret Edge extra: el cron secret vive en **Vault** + hash en `private.edge_cron_secrets`.

## Vault (cron)

| Name | Valor |
|---|---|
| `project_url` | `https://ptgltexbfxjqmyozcavt.supabase.co` |
| `booking_reminder_cron_secret` | aleatorio (hash en `private.edge_cron_secrets`) |
| `anon_key` | anon/publishable del proyecto |

## Ventana

Cita interpretada como `(booking_date + start_time) AT TIME ZONE 'Europe/Madrid'`.

Elegible si `now()` está entre **23 h y 24 h** antes del inicio.

## Prueba manual

```bash
# Secret desde Vault (SQL):
# select decrypted_secret from vault.decrypted_secrets where name = 'booking_reminder_cron_secret';

curl -i -X POST \
  'https://ptgltexbfxjqmyozcavt.supabase.co/functions/v1/send-booking-reminders' \
  -H 'Authorization: Bearer <booking_reminder_cron_secret>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```
