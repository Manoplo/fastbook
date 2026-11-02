import { toast } from 'sonner'
import { createElement } from 'react'
import { AppToastCard } from './app-toast-card'
import { APP_TOAST_DURATION_MS } from './app-toaster.constants'
import type { AppToastOptions, AppToastVariant } from './app-toaster.types'

function show(options: AppToastOptions & { variant: AppToastVariant }) {
  const { title, description, variant } = options

  return toast.custom(
    (toastId) =>
      createElement(AppToastCard, {
        toastId,
        title,
        description,
        variant,
        durationMs: APP_TOAST_DURATION_MS,
      }),
    {
      duration: APP_TOAST_DURATION_MS,
      unstyled: true,
    },
  )
}

export function showAppToast(options: AppToastOptions) {
  return show({
    ...options,
    variant: options.variant ?? 'success',
  })
}

export function showSuccessToast(title: string, description?: string) {
  return show({ title, description, variant: 'success' })
}

export function showErrorToast(title: string, description?: string) {
  return show({ title, description, variant: 'error' })
}
