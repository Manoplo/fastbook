import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import QRCode from 'npm:qrcode@1.5.4'

type BookingWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: { id?: string; check_in_token?: string } | null
  bookingId?: string
  checkInToken?: string
}

type BookingLookup =
  | { kind: 'id'; bookingId: string }
  | { kind: 'token'; checkInToken: string }

function extractBookingLookup(
  body: BookingWebhookPayload,
): BookingLookup | null {
  if (typeof body.checkInToken === 'string' && body.checkInToken.length > 0) {
    return { kind: 'token', checkInToken: body.checkInToken }
  }

  if (typeof body.bookingId === 'string' && body.bookingId.length > 0) {
    return { kind: 'id', bookingId: body.bookingId }
  }

  const recordId = body.record?.id
  if (
    body.type === 'INSERT' &&
    body.table === 'bookings' &&
    typeof recordId === 'string' &&
    recordId.length > 0
  ) {
    return { kind: 'id', bookingId: recordId }
  }

  return null
}

/** @deprecated usar extractBookingLookup */
function extractBookingId(body: BookingWebhookPayload): string | null {
  const lookup = extractBookingLookup(body)
  return lookup?.kind === 'id' ? lookup.bookingId : null
}

/**
 * Autoriza:
 * - Webhook / curl con `BOOKING_CONFIRMATION_WEBHOOK_SECRET`
 * - Cliente público con `checkInToken` (se valida contra BBDD después)
 */
function isAuthorized(
  req: Request,
  webhookSecret: string | undefined,
  body: BookingWebhookPayload,
): boolean {
  if (webhookSecret) {
    const bearer = req.headers.get('Authorization')
    if (bearer === `Bearer ${webhookSecret}`) {
      return true
    }
    const headerSecret = req.headers.get('x-booking-webhook-secret')
    if (headerSecret === webhookSecret) {
      return true
    }
  }

  return (
    typeof body.checkInToken === 'string' && body.checkInToken.length >= 32
  )
}

/** Misma forma de path que `src/lib/booking-check-in.utils.ts`. */
function bookingCheckInPath(
  tenantSlug: string,
  checkInToken: string,
): string {
  return `/enterprise/${encodeURIComponent(tenantSlug)}/check-in/${encodeURIComponent(checkInToken)}`
}

/** Misma forma que `enterpriseDashboardPath(slug, 'agenda')` en el FE. */
function enterpriseAgendaPath(tenantSlug: string): string {
  return `/enterprise/${encodeURIComponent(tenantSlug)}/agenda`
}

function formatBookingDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) {
    return dateKey
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function formatBookingTimeLabel(timeValue: string): string {
  const [hours, minutes] = timeValue.split(':')
  if (!hours || !minutes) {
    return timeValue
  }
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

type BookingConfirmationEmailInput = {
  tenantName: string
  customerName: string
  serviceName: string
  dateLabel: string
  timeLabel: string
  checkInUrl: string
}

type BookingConfirmationEmail = {
  subject: string
  html: string
  text: string
}

function buildBookingConfirmationEmail(
  input: BookingConfirmationEmailInput,
): BookingConfirmationEmail {
  const subject = `Reserva confirmada en ${input.tenantName}`
  const greetingName = input.customerName.trim() || 'hola'

  const text = [
    `Hola ${greetingName},`,
    '',
    `Tu cita en ${input.tenantName} está confirmada.`,
    `Cita: ${input.serviceName}`,
    `Fecha: ${input.dateLabel}`,
    `Hora: ${input.timeLabel}`,
    '',
    'Muestra el código QR adjunto el día de tu cita, o abre este enlace:',
    input.checkInUrl,
    '',
    '— Fastbook',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px 24px;">
            <tr>
              <td>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;">Reserva confirmada</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#444;">
                  Hola ${escapeHtml(greetingName)}, tu cita en
                  <strong>${escapeHtml(input.tenantName)}</strong> ya está guardada.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;border-radius:10px;padding:16px;">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Cita</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.serviceName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Fecha</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.dateLabel)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Hora</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.timeLabel)}</td>
                  </tr>
                </table>
                <p style="margin:24px 0 12px;font-size:15px;line-height:22px;color:#444;text-align:center;">
                  Muestra este código QR el día de tu cita:
                </p>
                <p style="margin:0 0 8px;text-align:center;">
                  <img src="cid:booking-qr" width="168" height="168" alt="Código QR de tu reserva" style="display:inline-block;border:0;" />
                </p>
                <p style="margin:16px 0 0;font-size:13px;line-height:18px;color:#666;text-align:center;">
                  Si no ves la imagen, abre tu comprobante:<br />
                  <a href="${escapeHtml(input.checkInUrl)}" style="color:#0b57d0;word-break:break-all;">${escapeHtml(input.checkInUrl)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}

type TenantBookingNotificationEmailInput = {
  tenantName: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  serviceName: string
  dateLabel: string
  timeLabel: string
  agendaUrl: string
}

/** Aviso al dueño del negocio (free y Pro). Sin QR. */
function buildTenantBookingNotificationEmail(
  input: TenantBookingNotificationEmailInput,
): BookingConfirmationEmail {
  const customerName = input.customerName.trim() || 'Cliente'
  const phone = input.customerPhone?.trim() || null
  const subject = `Nueva reserva · ${customerName} · ${input.dateLabel} ${input.timeLabel}`

  const textLines = [
    `Hola,`,
    '',
    `Tienes una nueva reserva en ${input.tenantName}.`,
    '',
    `Cliente: ${customerName}`,
    `Email: ${input.customerEmail}`,
  ]
  if (phone) {
    textLines.push(`Teléfono: ${phone}`)
  }
  textLines.push(
    `Cita: ${input.serviceName}`,
    `Fecha: ${input.dateLabel}`,
    `Hora: ${input.timeLabel}`,
    '',
    'Ver en la agenda:',
    input.agendaUrl,
    '',
    '— Fastbook',
  )

  const phoneRow = phone
    ? `
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Teléfono</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(phone)}</td>
                  </tr>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px 24px;">
            <tr>
              <td>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;">Nueva reserva</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#444;">
                  Alguien acaba de reservar en
                  <strong>${escapeHtml(input.tenantName)}</strong>.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;border-radius:10px;padding:16px;">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Cliente</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(customerName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Email</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.customerEmail)}</td>
                  </tr>${phoneRow}
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Cita</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.serviceName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Fecha</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.dateLabel)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#666;">Hora</td>
                    <td align="right" style="padding:4px 0;font-size:14px;font-weight:700;">${escapeHtml(input.timeLabel)}</td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;text-align:center;">
                  <a href="${escapeHtml(input.agendaUrl)}" style="display:inline-block;background:#0b57d0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 20px;border-radius:8px;">
                    Abrir agenda
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text: textLines.join('\n') }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const RESEND_API_URL = 'https://api.resend.com/emails'

const BOOKING_SELECT = `
  id,
  booking_date,
  start_time,
  end_time,
  customer_name,
  customer_email,
  customer_phone,
  check_in_token,
  status,
  tenant:tenants!bookings_tenant_id_fkey ( id, slug, name, owner_id ),
  service:services!bookings_service_id_fkey ( id, name, duration_minutes )
`

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return jsonResponse({ error: 'Missing RESEND_API_KEY secret' }, 500)
  }

  const appOrigin = Deno.env.get('APP_ORIGIN')?.replace(/\/$/, '')
  if (!appOrigin) {
    return jsonResponse({ error: 'Missing APP_ORIGIN secret' }, 500)
  }

  const fromEmail =
    Deno.env.get('BOOKING_EMAIL_FROM') ?? 'Fastbook <onboarding@resend.dev>'

  let body: BookingWebhookPayload
  try {
    body = (await req.json()) as BookingWebhookPayload
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const webhookSecret = Deno.env.get('BOOKING_CONFIRMATION_WEBHOOK_SECRET')
  if (!isAuthorized(req, webhookSecret, body)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const lookup = extractBookingLookup(body)
  if (!lookup) {
    return jsonResponse(
      {
        error:
          'Expected webhook INSERT, { bookingId }, or { checkInToken }',
      },
      400,
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase service env' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let bookingQuery = supabase.from('bookings').select(BOOKING_SELECT)
  bookingQuery =
    lookup.kind === 'id'
      ? bookingQuery.eq('id', lookup.bookingId)
      : bookingQuery.eq('check_in_token', lookup.checkInToken)

  const { data: booking, error: bookingError } = await bookingQuery.maybeSingle()

  if (bookingError) {
    console.error('booking lookup failed', bookingError)
    return jsonResponse({ error: 'Failed to load booking' }, 500)
  }

  if (!booking) {
    return jsonResponse({ error: 'Booking not found' }, 404)
  }

  if (booking.status === 'cancelled') {
    return jsonResponse({ ok: true, skipped: 'cancelled' })
  }

  const tenant = unwrapRelation(booking.tenant)
  const service = unwrapRelation(booking.service)

  if (!tenant?.slug || !tenant.name || !booking.check_in_token) {
    return jsonResponse({ error: 'Booking missing tenant or check_in_token' }, 500)
  }

  if (!booking.customer_email) {
    return jsonResponse({ error: 'Booking missing customer_email' }, 500)
  }

  const dateLabel = formatBookingDateLabel(booking.booking_date)
  const timeLabel = formatBookingTimeLabel(booking.start_time)
  const serviceName = service?.name ?? `Cita con ${tenant.name}`
  const checkInUrl = `${appOrigin}${bookingCheckInPath(
    tenant.slug,
    booking.check_in_token,
  )}`
  const agendaUrl = `${appOrigin}${enterpriseAgendaPath(tenant.slug)}`

  let qrPngBase64: string
  try {
    const dataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
    const base64 = dataUrl.split(',')[1]
    if (!base64) {
      throw new Error('QR data URL missing payload')
    }
    qrPngBase64 = base64
  } catch (error) {
    console.error('qr generation failed', error)
    return jsonResponse({ error: 'Failed to generate QR' }, 500)
  }

  const customerEmail = buildBookingConfirmationEmail({
    tenantName: tenant.name,
    customerName: booking.customer_name,
    serviceName,
    dateLabel,
    timeLabel,
    checkInUrl,
  })

  const customerSend = await sendResendEmail({
    apiKey: resendApiKey,
    from: fromEmail,
    to: booking.customer_email,
    subject: customerEmail.subject,
    html: customerEmail.html,
    text: customerEmail.text,
    idempotencyKey: `booking-confirmation/${booking.id}`,
    attachments: [
      {
        filename: 'reserva-qr.png',
        content: qrPngBase64,
        content_id: 'booking-qr',
      },
    ],
  })

  if (!customerSend.ok) {
    console.error('resend customer failed', customerSend.status, customerSend.body)
    return jsonResponse(
      {
        error: 'Resend rejected the customer email',
        status: customerSend.status,
        details: customerSend.body,
      },
      502,
    )
  }

  const tenantNotify = await sendTenantNotification({
    supabase,
    resendApiKey,
    fromEmail,
    bookingId: booking.id,
    ownerId: typeof tenant.owner_id === 'string' ? tenant.owner_id : null,
    tenantName: tenant.name,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone:
      typeof booking.customer_phone === 'string' ? booking.customer_phone : null,
    serviceName,
    dateLabel,
    timeLabel,
    agendaUrl,
  })

  return jsonResponse({
    ok: true,
    bookingId: booking.id,
    emailId: customerSend.body?.id ?? null,
    tenantNotification: tenantNotify,
  })
})

type ResendAttachment = {
  filename: string
  content: string
  content_id: string
}

type ResendSendResult =
  | { ok: true; status: number; body: { id?: string } | null }
  | { ok: false; status: number; body: unknown }

async function sendResendEmail(input: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
  attachments?: ResendAttachment[]
}): Promise<ResendSendResult> {
  const payload: Record<string, unknown> = {
    from: input.from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  }
  if (input.attachments?.length) {
    payload.attachments = input.attachments
  }

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify(payload),
  })

  const body = await resendResponse.json().catch(() => null)

  if (!resendResponse.ok) {
    return { ok: false, status: resendResponse.status, body }
  }

  return { ok: true, status: resendResponse.status, body }
}

type TenantNotifyResult =
  | { status: 'sent'; emailId: string | null }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string }

async function sendTenantNotification(input: {
  supabase: ReturnType<typeof createClient>
  resendApiKey: string
  fromEmail: string
  bookingId: string
  ownerId: string | null
  tenantName: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  serviceName: string
  dateLabel: string
  timeLabel: string
  agendaUrl: string
}): Promise<TenantNotifyResult> {
  if (!input.ownerId) {
    return { status: 'skipped', reason: 'tenant_without_owner' }
  }

  const { data: ownerData, error: ownerError } =
    await input.supabase.auth.admin.getUserById(input.ownerId)

  if (ownerError) {
    console.error('owner lookup failed', ownerError)
    return { status: 'failed', reason: 'owner_lookup_failed' }
  }

  const ownerEmail = ownerData.user?.email?.trim()
  if (!ownerEmail) {
    return { status: 'skipped', reason: 'owner_without_email' }
  }

  const email = buildTenantBookingNotificationEmail({
    tenantName: input.tenantName,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    serviceName: input.serviceName,
    dateLabel: input.dateLabel,
    timeLabel: input.timeLabel,
    agendaUrl: input.agendaUrl,
  })

  const send = await sendResendEmail({
    apiKey: input.resendApiKey,
    from: input.fromEmail,
    to: ownerEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey: `tenant-booking-notification/${input.bookingId}`,
  })

  if (!send.ok) {
    console.error('resend tenant failed', send.status, send.body)
    return { status: 'failed', reason: 'resend_rejected' }
  }

  return { status: 'sent', emailId: send.body?.id ?? null }
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null
  }
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-booking-webhook-secret',
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    },
  })
}
