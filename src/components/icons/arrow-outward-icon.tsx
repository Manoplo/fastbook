type ArrowOutwardIconProps = {
  className?: string
}

/** Flecha noreste (Material-style arrow_outward). */
export function ArrowOutwardIcon({ className }: ArrowOutwardIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6z" />
    </svg>
  )
}
