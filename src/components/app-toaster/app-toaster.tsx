import { Toaster } from 'sonner'
import { APP_TOAST_DURATION_MS } from './app-toaster.constants'
import './app-toaster.css'

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      duration={APP_TOAST_DURATION_MS}
      gap={12}
      visibleToasts={4}
      offset={{ top: '1.25rem', right: '1.25rem' }}
      mobileOffset={{ top: '1rem', right: '0.75rem', left: '0.75rem' }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'app-toast-root',
        },
      }}
    />
  )
}
