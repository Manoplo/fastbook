import type { IconProps } from './icons.types'

export function PersonOutlineIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5.9A2.1 2.1 0 1 1 9.9 8 2.1 2.1 0 0 1 12 5.9m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"
      />
    </svg>
  )
}
