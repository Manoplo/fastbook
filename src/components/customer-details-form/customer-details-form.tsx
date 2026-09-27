import {
  PHONE_COUNTRY_CODES,
  type CustomerDetailsFormProps,
} from './customer-details-form.types'
import './customer-details-form.css'

function PersonOutlineIcon() {
  return (
    <svg className="customer-details-form__header-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5.9A2.1 2.1 0 1 1 9.9 8 2.1 2.1 0 0 1 12 5.9m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"
      />
    </svg>
  )
}

function AccountCircleIcon() {
  return (
    <svg className="customer-details-form__field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="customer-details-form__field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="customer-details-form__hint-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="customer-details-form__info-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      />
    </svg>
  )
}

function SmartphoneIcon() {
  return (
    <svg className="customer-details-form__field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="customer-details-form__shield-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
      />
    </svg>
  )
}

export function CustomerDetailsForm({
  values,
  tenantName,
  onChange,
}: CustomerDetailsFormProps) {
  return (
    <section className="customer-details-form" aria-label="Información del titular">
      <header className="customer-details-form__header">
        <div className="customer-details-form__header-main">
          <div className="customer-details-form__header-icon-wrap">
            <PersonOutlineIcon />
          </div>
          <div>
            <h2 className="customer-details-form__title">Información del titular</h2>
            <p className="customer-details-form__subtitle">
              Los datos deben coincidir con la persona que acudirá al centro.
            </p>
          </div>
        </div>
        <span className="customer-details-form__required-badge">Obligatorio *</span>
      </header>

      <div className="customer-details-form__body">
        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-full-name">
            <span>
              Nombre y Apellidos <span className="customer-details-form__asterisk">*</span>
            </span>
            <span className="customer-details-form__label-hint">Identificación presencial</span>
          </label>
          <div className="customer-details-form__input-wrap">
            <AccountCircleIcon />
            <input
              id="customer-full-name"
              className="customer-details-form__input"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Elena Morales García"
              value={values.fullName}
              onChange={(event) => onChange({ fullName: event.target.value })}
            />
          </div>
        </div>

        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-email">
            <span>
              Correo electrónico <span className="customer-details-form__asterisk">*</span>
            </span>
            <span className="customer-details-form__label-hint customer-details-form__label-hint--accent">
              <SendIcon />
              Envío de Pase QR
            </span>
          </label>
          <div className="customer-details-form__input-wrap">
            <MailIcon />
            <input
              id="customer-email"
              className="customer-details-form__input"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="elena.morales@ejemplo.com"
              value={values.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
          </div>
          <div className="customer-details-form__helper">
            <InfoIcon />
            <p>
              Te enviaremos el comprobante y el acceso QR a esta dirección para entrar al
              centro sin esperas.
            </p>
          </div>
        </div>

        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-phone">
            <span>
              Teléfono móvil{' '}
              <span className="customer-details-form__optional">(Opcional)</span>
            </span>
            <span className="customer-details-form__label-hint">Aviso 2h antes</span>
          </label>
          <div className="customer-details-form__phone-row">
            <label className="visually-hidden" htmlFor="customer-phone-country">
              Prefijo internacional
            </label>
            <select
              id="customer-phone-country"
              className="customer-details-form__select"
              value={values.phoneCountryCode}
              onChange={(event) =>
                onChange({
                  phoneCountryCode: event.target.value as typeof values.phoneCountryCode,
                })
              }
            >
              {PHONE_COUNTRY_CODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="customer-details-form__input-wrap customer-details-form__input-wrap--phone">
              <SmartphoneIcon />
              <input
                id="customer-phone"
                className="customer-details-form__input"
                name="phone"
                type="tel"
                autoComplete="tel-national"
                placeholder="612 345 678"
                value={values.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
              />
            </div>
          </div>
          <p className="customer-details-form__helper-text">
            Solo para recordatorio SMS gratuito 2h antes de tu cita programada.
          </p>
        </div>

        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-notes">
            <span>Indicaciones o preferencias médicas / estéticas</span>
            <span className="customer-details-form__label-hint">(Opcional)</span>
          </label>
          <textarea
            id="customer-notes"
            className="customer-details-form__textarea"
            name="notes"
            rows={3}
            placeholder="Indica alergias, sensibilidades cutáneas o si requieres asistencia específica en cabina…"
            value={values.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </div>

        <div className="customer-details-form__divider" aria-hidden="true" />

        <div className="customer-details-form__consents">
          <label className="customer-details-form__consent">
            <input
              type="checkbox"
              className="customer-details-form__checkbox"
              checked={values.privacyAccepted}
              required
              onChange={(event) => onChange({ privacyAccepted: event.target.checked })}
            />
            <span>
              He leído y acepto la{' '}
              <a className="customer-details-form__link" href="#privacidad">
                Política de Privacidad
              </a>{' '}
              y el tratamiento de mis datos personales de conformidad con el RGPD y la
              normativa española vigente.{' '}
              <span className="customer-details-form__asterisk">*</span>
            </span>
          </label>

          <label className="customer-details-form__consent">
            <input
              type="checkbox"
              className="customer-details-form__checkbox"
              checked={values.smsReminders}
              onChange={(event) => onChange({ smsReminders: event.target.checked })}
            />
            <span className="customer-details-form__consent-muted">
              Deseo recibir recordatorios de mi cita por SMS y alertas instantáneas de
              disponibilidad por si mi hora puede adelantarse.
            </span>
          </label>
        </div>

        <aside className="customer-details-form__notice">
          <div className="customer-details-form__notice-icon">
            <ShieldIcon />
          </div>
          <div>
            <h3 className="customer-details-form__notice-title">
              Aviso de Protección de Datos
            </h3>
            <p className="customer-details-form__notice-text">
              <strong>fastbook</strong> trata tus datos únicamente para gestionar tu cita
              en {tenantName}. No compartimos tus datos con terceros con fines
              publicitarios. Puedes ejercer tus derechos de acceso, rectificación y
              supresión en cualquier momento mediante comunicación a nuestro delegado de
              privacidad.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
