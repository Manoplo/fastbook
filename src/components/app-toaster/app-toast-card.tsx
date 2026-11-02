import classNames from 'classnames'
import { toast } from 'sonner'
import { CheckCircleIcon } from '@components/icons/check-circle-icon'
import { CloseIcon } from '@components/icons/close-icon'
import { InfoIcon } from '@components/icons/info-icon'
import type { AppToastCardProps, AppToastVariant } from './app-toaster.types'

function VariantIcon({ variant }: { variant: AppToastVariant }) {
  if (variant === 'success') {
    return <CheckCircleIcon className="app-toast__icon-svg" />
  }
  if (variant === 'error') {
    return <InfoIcon className="app-toast__icon-svg" />
  }
  return <InfoIcon className="app-toast__icon-svg" />
}

export function AppToastCard({
  toastId,
  title,
  description,
  variant,
  durationMs,
}: AppToastCardProps) {
  return (
    <div
      className={classNames('app-toast', `app-toast--${variant}`)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <div className="app-toast__body">
        <span className="app-toast__icon" aria-hidden="true">
          <VariantIcon variant={variant} />
        </span>
        <div className="app-toast__copy">
          <p className="app-toast__title">{title}</p>
          {description ? <p className="app-toast__description">{description}</p> : null}
        </div>
        <button
          type="button"
          className="app-toast__dismiss"
          aria-label="Cerrar notificación"
          onClick={() => {
            toast.dismiss(toastId)
          }}
        >
          <CloseIcon className="app-toast__dismiss-icon" />
        </button>
      </div>
      <div className="app-toast__timer" aria-hidden="true">
        <span
          className="app-toast__timer-bar"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  )
}
