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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
