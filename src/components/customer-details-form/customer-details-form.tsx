import { useFormContext } from 'react-hook-form'
import { hasSaasImplementation } from '../../lib/feature-flags'
import {
  PHONE_COUNTRY_CODES,
  type CustomerDetailsFormProps,
  type CustomerDetailsFormValues,
} from './customer-details-form.types'
import { AccountCircleIcon } from '../icons/account-circle-icon'
import { InfoIcon } from '../icons/info-icon'
import { MailIcon } from '../icons/mail-icon'
import { PersonOutlineIcon } from '../icons/person-outline-icon'
import { SendIcon } from '../icons/send-icon'
import { ShieldIcon } from '../icons/shield-icon'
import { SmartphoneIcon } from '../icons/smartphone-icon'
import './customer-details-form.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CustomerDetailsForm({ tenantName }: CustomerDetailsFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CustomerDetailsFormValues>()

  return (
    <section className="customer-details-form" aria-label="Información del titular">
      <header className="customer-details-form__header">
        <div className="customer-details-form__header-main">
          <div className="customer-details-form__header-icon-wrap">
            <PersonOutlineIcon className="customer-details-form__header-icon" />
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
            <AccountCircleIcon className="customer-details-form__field-icon" />
            <input
              id="customer-full-name"
              className={[
                'customer-details-form__input',
                errors.fullName ? 'customer-details-form__input--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="text"
              autoComplete="name"
              placeholder="Elena Morales García"
              aria-invalid={Boolean(errors.fullName)}
              {...register('fullName', {
                required: 'Indica tu nombre y apellidos',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres',
                },
                validate: (value) =>
                  value.trim().length >= 2 || 'Indica tu nombre y apellidos',
              })}
            />
          </div>
          {errors.fullName ? (
            <p className="customer-details-form__error" role="alert">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-email">
            <span>
              Correo electrónico <span className="customer-details-form__asterisk">*</span>
            </span>
            <span className="customer-details-form__label-hint customer-details-form__label-hint--accent">
              <SendIcon className="customer-details-form__hint-icon" />
              Envío de Pase QR
            </span>
          </label>
          <div className="customer-details-form__input-wrap">
            <MailIcon className="customer-details-form__field-icon" />
            <input
              id="customer-email"
              className={[
                'customer-details-form__input',
                errors.email ? 'customer-details-form__input--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="email"
              autoComplete="email"
              placeholder="elena.morales@ejemplo.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email', {
                required: 'Indica tu correo electrónico',
                pattern: {
                  value: EMAIL_PATTERN,
                  message: 'Introduce un correo válido',
                },
              })}
            />
          </div>
          {errors.email ? (
            <p className="customer-details-form__error" role="alert">
              {errors.email.message}
            </p>
          ) : (
            <div className="customer-details-form__helper">
              <InfoIcon className="customer-details-form__info-icon" />
              <p>Te enviaremos el comprobante y el acceso QR a esta dirección.</p>
            </div>
          )}
        </div>

        <div className="customer-details-form__field">
          <label className="customer-details-form__label" htmlFor="customer-phone">
            <span>
              Teléfono móvil{' '}
              <span className="customer-details-form__optional">(Opcional)</span>
            </span>
            {hasSaasImplementation ? (
              <span className="customer-details-form__label-hint">Aviso 2h antes</span>
            ) : null}
          </label>
          <div className="customer-details-form__phone-row">
            <label className="visually-hidden" htmlFor="customer-phone-country">
              Prefijo internacional
            </label>
            <select
              id="customer-phone-country"
              className="customer-details-form__select"
              {...register('phoneCountryCode')}
            >
              {PHONE_COUNTRY_CODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="customer-details-form__input-wrap customer-details-form__input-wrap--phone">
              <SmartphoneIcon className="customer-details-form__field-icon" />
              <input
                id="customer-phone"
                className="customer-details-form__input"
                type="tel"
                autoComplete="tel-national"
                placeholder="612 345 678"
                {...register('phone')}
              />
            </div>
          </div>
          {hasSaasImplementation ? (
            <p className="customer-details-form__helper-text">
              Solo para recordatorio SMS gratuito 2h antes de tu cita programada.
            </p>
          ) : null}
        </div>

        <div className="customer-details-form__divider" aria-hidden="true" />

        <div className="customer-details-form__consents">
          <label
            className={[
              'customer-details-form__consent',
              errors.privacyAccepted ? 'customer-details-form__consent--error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <input
              type="checkbox"
              className="customer-details-form__checkbox"
              aria-invalid={Boolean(errors.privacyAccepted)}
              {...register('privacyAccepted', {
                validate: (value) =>
                  value === true || 'Debes aceptar la política de privacidad',
              })}
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
          {errors.privacyAccepted ? (
            <p className="customer-details-form__error" role="alert">
              {errors.privacyAccepted.message}
            </p>
          ) : null}

          {hasSaasImplementation ? (
            <label className="customer-details-form__consent">
              <input
                type="checkbox"
                className="customer-details-form__checkbox"
                {...register('smsReminders')}
              />
              <span className="customer-details-form__consent-muted">
                Deseo recibir recordatorios de mi cita por SMS y alertas instantáneas de
                disponibilidad por si mi hora puede adelantarse.
              </span>
            </label>
          ) : null}
        </div>

        <aside className="customer-details-form__notice">
          <div className="customer-details-form__notice-icon">
            <ShieldIcon className="customer-details-form__shield-icon" />
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
