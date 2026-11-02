export type AppToastVariant = 'success' | 'error' | 'info'

export type AppToastOptions = {
  title: string
  description?: string
  variant?: AppToastVariant
}

export type AppToastCardProps = {
  toastId: string | number
  title: string
  description?: string
  variant: AppToastVariant
  durationMs: number
}
