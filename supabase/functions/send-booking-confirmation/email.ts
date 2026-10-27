export type BookingConfirmationEmailInput = {
  tenantName: string
  customerName: string
  serviceName: string
  dateLabel: string
  timeLabel: string
  checkInUrl: string
}

export type BookingConfirmationEmail = {
  subject: string
  html: string
  text: string
}

export function buildBookingConfirmationEmail(
  input: BookingConfirmationEmailInput,
): BookingConfirmationEmail {
  const subject = `Reserva confirmada en ${input.tenantName}`
  const greetingName = input.customerName.trim() || 'hola'

  const text = [
    `Hola ${greetingName},`,
    '',
    `Tu cita en ${input.tenantName} está confirmada.`,
    `Servicio: ${input.serviceName}`,
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
                    <td style="padding:4px 0;font-size:14px;color:#666;">Servicio</td>
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

export type TenantBookingNotificationEmailInput = {
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
export function buildTenantBookingNotificationEmail(
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
    `Servicio: ${input.serviceName}`,
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
                    <td style="padding:4px 0;font-size:14px;color:#666;">Servicio</td>
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
