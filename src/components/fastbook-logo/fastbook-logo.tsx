import logoUrl from '../../assets/fastbook-logo.svg'
import './fastbook-logo.css'

type FastbookLogoProps = {
  className?: string
}

export function FastbookLogo({ className = '' }: FastbookLogoProps) {
  return (
    <img
      className={['fastbook-logo', className].filter(Boolean).join(' ')}
      src={logoUrl}
      alt="fastbook"
      width={186}
      height={48}
    />
  )
}
