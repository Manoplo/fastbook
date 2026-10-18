import classNames from 'classnames'
import { AddIcon } from '@components/icons/add-icon'
import { DeleteIcon } from '@components/icons/delete-icon'
import { EditIcon } from '@components/icons/edit-icon'
import { ImageIcon } from '@components/icons/image-icon'
import { LockIcon } from '@components/icons/lock-icon'
import type { TenantServiceRow } from '@src/lib/tenant-services'
import {
  FREE_MAX_SERVICES,
  canAddService,
  canUploadServiceImage,
  formatPriceEuro,
} from '../enterprise-schedules.utils'
import type { ServicesCatalogProps } from './services-catalog.types'
import './services-catalog.css'

export function ServicesCatalog({
  services,
  isPro,
  isSaving,
  errorMessage,
  editingServiceId,
  formValues,
  onFormChange,
  onStartCreate,
  onStartEdit,
  onCancelEdit,
  onSubmit,
  onDelete,
  onRequestUpgrade,
  onOpenServiceImages,
}: ServicesCatalogProps) {
  const allowAdd = canAddService({ isPro, serviceCount: services.length })
  const allowImage = canUploadServiceImage(isPro)
  const isCreating = editingServiceId === 'new'
  const editingService =
    editingServiceId && editingServiceId !== 'new'
      ? (services.find((service) => service.id === editingServiceId) ?? null)
      : null

  function handleAddClick() {
    if (!allowAdd) {
      onRequestUpgrade('service_limit')
      return
    }
    onStartCreate()
  }

  function handleImageClick(service: TenantServiceRow | null) {
    if (!allowImage) {
      onRequestUpgrade('image_upload')
      return
    }
    onOpenServiceImages(service)
  }

  return (
    <section className="services-catalog" aria-labelledby="services-catalog-title">
      <header className="services-catalog__header">
        <div>
          <h2 id="services-catalog-title" className="services-catalog__title">
            Catálogo de servicios
          </h2>
          <p className="services-catalog__subtitle">
            {isPro
              ? 'Gestiona los servicios visibles en tu página pública de reservas.'
              : `Plan gratuito: hasta ${FREE_MAX_SERVICES} servicios activos.`}
          </p>
        </div>
        {!isCreating ? (
          <button type="button" className="services-catalog__add" onClick={handleAddClick}>
            <AddIcon className="services-catalog__add-icon" />
            Añadir servicio
          </button>
        ) : null}
      </header>

      <ul className="services-catalog__list">
        {services.length === 0 ? (
          <li className="services-catalog__empty">Aún no tienes servicios. Añade el primero.</li>
        ) : (
          services.map((service) => (
            <li key={service.id} className="services-catalog__item">
              <button
                type="button"
                className={classNames('services-catalog__image', {
                  'services-catalog__image--locked': !allowImage,
                })}
                onClick={() => {
                  handleImageClick(service)
                }}
                aria-label={
                  allowImage
                    ? 'Abrir galería del servicio'
                    : 'Imagen disponible en plan Pro'
                }
              >
                {service.image_url ? (
                  <img src={service.image_url} alt="" />
                ) : (
                  <>
                    <ImageIcon className="services-catalog__image-icon" />
                    {!allowImage ? (
                      <span className="services-catalog__image-lock">
                        <LockIcon className="services-catalog__lock-icon" />
                        Foto en Pro
                      </span>
                    ) : (
                      <span className="services-catalog__image-hint">Añadir foto</span>
                    )}
                  </>
                )}
              </button>

              <div className="services-catalog__body">
                <div className="services-catalog__title-row">
                  <h3 className="services-catalog__name">{service.name}</h3>
                  <span
                    className={classNames('services-catalog__badge', {
                      'services-catalog__badge--inactive': !service.active,
                    })}
                  >
                    {service.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="services-catalog__meta">
                  {service.duration_minutes} min · {formatPriceEuro(Number(service.price))}
                </p>
                {service.description ? (
                  <p className="services-catalog__description">{service.description}</p>
                ) : null}
              </div>

              <div className="services-catalog__actions">
                <button
                  type="button"
                  className="services-catalog__icon-btn"
                  aria-label={`Editar ${service.name}`}
                  onClick={() => {
                    onStartEdit(service)
                  }}
                >
                  <EditIcon className="services-catalog__action-icon" />
                </button>
                <button
                  type="button"
                  className="services-catalog__icon-btn services-catalog__icon-btn--danger"
                  aria-label={`Eliminar ${service.name}`}
                  onClick={() => {
                    onDelete(service)
                  }}
                >
                  <DeleteIcon className="services-catalog__action-icon" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {editingServiceId ? (
        <form
          className="services-catalog__form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <h3 className="services-catalog__form-title">
            {isCreating ? 'Añadir nuevo servicio' : 'Editar servicio'}
          </h3>

          <div className="services-catalog__form-grid">
            <label className="services-catalog__field services-catalog__field--wide">
              <span>Nombre del servicio</span>
              <input
                value={formValues.name}
                onChange={(event) => {
                  onFormChange({ ...formValues, name: event.target.value })
                }}
                required
                maxLength={120}
              />
            </label>
            <label className="services-catalog__field">
              <span>Duración (minutos)</span>
              <input
                type="number"
                min={5}
                step={5}
                value={formValues.durationMinutes}
                onChange={(event) => {
                  onFormChange({ ...formValues, durationMinutes: event.target.value })
                }}
                required
              />
            </label>
            <label className="services-catalog__field">
              <span>Precio (€)</span>
              <input
                inputMode="decimal"
                value={formValues.price}
                onChange={(event) => {
                  onFormChange({ ...formValues, price: event.target.value })
                }}
                required
              />
            </label>
            <label className="services-catalog__field services-catalog__field--wide">
              <span>Descripción</span>
              <textarea
                rows={3}
                value={formValues.description}
                onChange={(event) => {
                  onFormChange({ ...formValues, description: event.target.value })
                }}
              />
            </label>
            <label className="services-catalog__checkbox">
              <input
                type="checkbox"
                checked={formValues.active}
                onChange={(event) => {
                  onFormChange({ ...formValues, active: event.target.checked })
                }}
              />
              <span>Servicio activo (visible en la página pública)</span>
            </label>
          </div>

          <button
            type="button"
            className={classNames('services-catalog__image-upload', {
              'services-catalog__image-upload--locked': !allowImage,
            })}
            onClick={() => {
              handleImageClick(editingService)
            }}
          >
            <ImageIcon className="services-catalog__image-upload-icon" />
            <span>
              {allowImage
                ? 'Galería e imágenes del servicio'
                : 'Subida de imagen solo en plan Pro'}
            </span>
            {!allowImage ? <LockIcon className="services-catalog__lock-icon" /> : null}
          </button>

          {errorMessage ? (
            <p className="services-catalog__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="services-catalog__form-actions">
            <button
              type="button"
              className="services-catalog__secondary"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button type="submit" className="services-catalog__primary" disabled={isSaving}>
              {isSaving ? 'Guardando…' : isCreating ? 'Crear servicio' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
