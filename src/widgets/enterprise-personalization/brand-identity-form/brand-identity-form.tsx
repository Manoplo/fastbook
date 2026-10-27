import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { CloseIcon } from '@components/icons/close-icon'
import { ImageIcon } from '@components/icons/image-icon'
import { loadBrandFont } from '@src/lib/tenant-branding-fonts'
import {
  BRAND_FONT_OPTIONS,
  MAX_LOGO_HEIGHT,
  MIN_LOGO_HEIGHT,
  brandFontFamily,
  brandingWarningMessage,
  brandingWarnings,
  clampLogoHeight,
  normalizeHex,
  pickOnColor,
} from '@src/lib/tenant-branding.utils'
import { LOGO_ACCEPTED_MIME_TYPES } from '../enterprise-personalization.utils'
import type { BrandIdentityFormProps, ColorFieldProps } from './brand-identity-form.types'
import './brand-identity-form.css'

function ColorField({ id, label, value, disabled, onChange }: ColorFieldProps) {
  const [typed, setTyped] = useState<string | null>(null)

  return (
    <div className="brand-identity-form__color">
      <label className="brand-identity-form__label" htmlFor={`${id}-hex`}>
        {label}
      </label>
      <div className="brand-identity-form__color-inputs">
        <input
          type="color"
          className="brand-identity-form__swatch"
          aria-label={`${label} (selector de color)`}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
        <input
          id={`${id}-hex`}
          type="text"
          className="brand-identity-form__hex"
          spellCheck={false}
          maxLength={7}
          value={typed ?? value}
          disabled={disabled}
          onChange={(event) => {
            setTyped(event.target.value)
            const hex = normalizeHex(event.target.value)
            if (hex) {
              onChange(hex)
            }
          }}
          onBlur={() => {
            setTyped(null)
          }}
        />
      </div>
    </div>
  )
}

export function BrandIdentityForm({
  isPro,
  logo,
  draft,
  isDirty,
  isSaving,
  errorMessage,
  successMessage,
  onLogoSelect,
  onLogoRemove,
  onDraftChange,
  onReset,
  onSave,
  onRequestUpgrade,
}: BrandIdentityFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const locked = !isPro
  const warnings = brandingWarnings(draft)
  const logoSrc = logo ? (logo.kind === 'remote' ? logo.url : logo.previewUrl) : null

  useEffect(() => {
    for (const option of BRAND_FONT_OPTIONS) {
      void loadBrandFont(option.key)
    }
  }, [])

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) {
      onLogoSelect(file)
    }
  }

  return (
    <section className="brand-identity-form" aria-labelledby="brand-identity-title">
      <header className="brand-identity-form__header">
        <div>
          <h2 id="brand-identity-title" className="brand-identity-form__title">
            Identidad de tu página de reservas
          </h2>
          <p className="brand-identity-form__subtitle">
            Logo, colores y tipografía que verán tus clientes en tu enlace público.
          </p>
        </div>
        <button
          type="button"
          className="brand-identity-form__reset"
          disabled={locked || isSaving}
          onClick={onReset}
        >
          Restablecer
        </button>
      </header>

      {locked ? (
        <div className="brand-identity-form__pro-banner" role="note">
          <p>
            La personalización es una función de <strong>fastbook Pro</strong>. Puedes probar los
            cambios en la vista previa cuando actives el plan.
          </p>
          <button type="button" onClick={onRequestUpgrade}>
            Ver planes Pro
          </button>
        </div>
      ) : null}

      <fieldset className="brand-identity-form__section" disabled={locked || isSaving}>
        <legend className="brand-identity-form__legend">Logotipo</legend>

        <div className="brand-identity-form__logo-row">
          <div
            className={classNames('brand-identity-form__dropzone', {
              'brand-identity-form__dropzone--active': isDragging,
              'brand-identity-form__dropzone--filled': Boolean(logoSrc),
            })}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => {
              setIsDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFiles(event.dataTransfer.files)
            }}
          >
            {logoSrc ? (
              <img
                className="brand-identity-form__logo-preview"
                src={logoSrc}
                alt="Logotipo actual"
                style={{ height: `${draft.logoHeight}px` }}
              />
            ) : (
              <>
                <ImageIcon className="brand-identity-form__dropzone-icon" />
                <p className="brand-identity-form__dropzone-text">
                  Arrastra tu logo aquí o <span>elige un archivo</span>
                </p>
                <p className="brand-identity-form__dropzone-hint">PNG, JPEG o SVG · máx. 5 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="brand-identity-form__file"
              accept={LOGO_ACCEPTED_MIME_TYPES.join(',')}
              aria-label="Subir logotipo"
              onChange={(event) => {
                handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>

          {logoSrc ? (
            <div className="brand-identity-form__logo-actions">
              <button
                type="button"
                className="brand-identity-form__chip"
                onClick={() => {
                  fileInputRef.current?.click()
                }}
              >
                Cambiar
              </button>
              <button
                type="button"
                className="brand-identity-form__chip brand-identity-form__chip--danger"
                onClick={onLogoRemove}
              >
                <CloseIcon className="brand-identity-form__chip-icon" />
                Quitar
              </button>
            </div>
          ) : null}
        </div>

        <div className="brand-identity-form__size">
          <label className="brand-identity-form__label" htmlFor="brand-logo-height">
            Tamaño del logo en la cabecera
          </label>
          <div className="brand-identity-form__size-control">
            <input
              id="brand-logo-height"
              type="range"
              min={MIN_LOGO_HEIGHT}
              max={MAX_LOGO_HEIGHT}
              step={2}
              value={draft.logoHeight}
              disabled={!logoSrc}
              onChange={(event) => {
                onDraftChange({ logoHeight: clampLogoHeight(Number(event.target.value)) })
              }}
            />
            <output htmlFor="brand-logo-height">{draft.logoHeight} px</output>
          </div>
        </div>
      </fieldset>

      <fieldset className="brand-identity-form__section" disabled={locked || isSaving}>
        <legend className="brand-identity-form__legend">Colores</legend>
        <div className="brand-identity-form__colors">
          <ColorField
            id="brand-primary"
            label="Color primario (CTAs)"
            value={draft.primary}
            disabled={locked || isSaving}
            onChange={(primary) => {
              onDraftChange({ primary })
            }}
          />
          <ColorField
            id="brand-secondary"
            label="Color secundario (acentos)"
            value={draft.secondary}
            disabled={locked || isSaving}
            onChange={(secondary) => {
              onDraftChange({ secondary })
            }}
          />
          <ColorField
            id="brand-surface"
            label="Fondo de cajas"
            value={draft.surface}
            disabled={locked || isSaving}
            onChange={(surface) => {
              onDraftChange({ surface, onSurface: pickOnColor(surface) })
            }}
          />
          <ColorField
            id="brand-on-surface"
            label="Tipografía"
            value={draft.onSurface}
            disabled={locked || isSaving}
            onChange={(onSurface) => {
              onDraftChange({ onSurface })
            }}
          />
        </div>
        <p className="brand-identity-form__hint brand-identity-form__hint--inline">
          Al cambiar el fondo, la tipografía se ajusta sola para mantener contraste. Puedes
          sobrescribirla. Ejemplo: cajas negras + tipografía blanca.
        </p>
        {warnings.map((warning) => (
          <p key={warning} className="brand-identity-form__warning" role="status">
            {brandingWarningMessage(warning)}
          </p>
        ))}
      </fieldset>

      <fieldset className="brand-identity-form__section" disabled={locked || isSaving}>
        <legend className="brand-identity-form__legend">Tipografía</legend>
        <div className="brand-identity-form__fonts" role="radiogroup" aria-label="Tipografía">
          {BRAND_FONT_OPTIONS.map((option) => (
            <label
              key={option.key}
              className={classNames('brand-identity-form__font', {
                'brand-identity-form__font--selected': draft.fontKey === option.key,
              })}
            >
              <input
                type="radio"
                name="brand-font"
                value={option.key}
                checked={draft.fontKey === option.key}
                onChange={() => {
                  onDraftChange({ fontKey: option.key })
                }}
              />
              <span
                className="brand-identity-form__font-sample"
                style={{ fontFamily: brandFontFamily(option.key) }}
                aria-hidden="true"
              >
                Aa
              </span>
              <span className="brand-identity-form__font-name">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <footer className="brand-identity-form__footer">
        <p className="brand-identity-form__hint">
          Los cambios se publican en tu enlace al guardar.
        </p>
        {errorMessage ? (
          <p className="brand-identity-form__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="brand-identity-form__success" role="status">
            {successMessage}
          </p>
        ) : null}
        <button
          type="button"
          className="brand-identity-form__save"
          disabled={locked || isSaving || !isDirty}
          onClick={onSave}
        >
          {isSaving ? 'Guardando…' : 'Guardar personalización'}
        </button>
      </footer>
    </section>
  )
}
