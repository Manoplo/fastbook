import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import QRCode from 'npm:qrcode@1.5.4'
import { buildBookingReminderEmail } from './email.ts'
import {
  bookingCheckInPath,
  extractBearerToken,
  formatBookingDateLabel,
  formatBookingTimeLabel,
} from './utils.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'

type ClaimedReminder = {
  id: string
  customer_name: string
  customer_email: string
  booking_date: string
  start_time: string
  check_in_token: string
  tenant_name: string
  tenant_slug: string
  service_name: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase service env' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const bearer = extractBearerToken(req)
  if (!bearer) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { data: authorized, error: authError } = await supabase.rpc(
    'verify_booking_reminder_cron_secret',
    { p_secret: bearer },
  )

  if (authError) {
    console.error('cron secret verify failed', authError)
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (authorized !== true) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    'claim_due_booking_reminders',
    { p_limit: 50 },
  )

  if (claimError) {
    console.error('claim_due_booking_reminders failed', claimError)
    return jsonResponse({ error: 'Failed to claim reminders' }, 500)
  }

  const rows = (claimed ?? []) as ClaimedReminder[]
  if (rows.length === 0) {
    return jsonResponse({ ok: true, processed: 0, sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0
  const failures: Array<{ bookingId: string; reason: string }> = []

  for (const row of rows) {
    try {
      await sendReminderEmail({
        resendApiKey,
        fromEmail,
        appOrigin,
        row,
      })
      sent += 1
    } catch (error) {
      failed += 1
      const reason = error instanceof Error ? error.message : 'unknown'
      failures.push({ bookingId: row.id, reason })
      console.error('reminder send failed', row.id, error)

      const { error: releaseError } = await supabase.rpc(
        'release_booking_reminder',
        { p_booking_id: row.id },
      )
      if (releaseError) {
        console.error('release_booking_reminder failed', row.id, releaseError)
      }
    }
  }

  return jsonResponse({
    ok: true,
    processed: rows.length,
    sent,
    failed,
    failures,
  })
})

async function sendReminderEmail(input: {
  resendApiKey: string
  fromEmail: string
  appOrigin: string
  row: ClaimedReminder
}): Promise<void> {
  const { row } = input
  if (!row.check_in_token || !row.customer_email || !row.tenant_slug) {
    throw new Error('booking missing required fields')
  }

  const checkInUrl = `${input.appOrigin}${bookingCheckInPath(
    row.tenant_slug,
    row.check_in_token,
  )}`

  const dataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
  const qrPngBase64 = dataUrl.split(',')[1]
  if (!qrPngBase64) {
    throw new Error('QR data URL missing payload')
  }

  const email = buildBookingReminderEmail({
    tenantName: row.tenant_name,
    customerName: row.customer_name,
    serviceName: row.service_name || 'Servicio',
    dateLabel: formatBookingDateLabel(row.booking_date),
    timeLabel: formatBookingTimeLabel(row.start_time),
    checkInUrl,
  })

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `booking-reminder/${row.id}`,
    },
    body: JSON.stringify({
      from: input.fromEmail,
      to: [row.customer_email],
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [
        {
          filename: 'reserva-qr.png',
          content: qrPngBase64,
          content_id: 'booking-qr',
        },
      ],
    }),
  })

  const resendBody = await resendResponse.json().catch(() => null)
  if (!resendResponse.ok) {
    throw new Error(
      `Resend ${resendResponse.status}: ${JSON.stringify(resendBody)}`,
    )
  }
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
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
