import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import QRCode from 'npm:qrcode@1.5.4'
import {
  buildBookingConfirmationEmail,
  buildTenantBookingNotificationEmail,
} from './email.ts'
import {
  bookingCheckInPath,
  enterpriseAgendaPath,
  extractBookingLookup,
  formatBookingDateLabel,
  formatBookingTimeLabel,
  isAuthorized,
  type BookingWebhookPayload,
} from './utils.ts'

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
  const serviceName = service?.name ?? 'Servicio'
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
