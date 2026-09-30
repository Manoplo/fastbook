import type { IconProps } from './icons.types'

export function QrCodeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13 2h-2v2h2v-2zm2-2h-6v6h2v-2h2v2h2v-6zm-4 0h-2v2h2v-2z"
      />
    </svg>
  )
}
