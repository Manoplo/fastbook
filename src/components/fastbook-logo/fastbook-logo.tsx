import classNames from 'classnames'
import logoUrl from '@src/assets/fastbook-logo.svg'
import './fastbook-logo.css'

type FastbookLogoProps = {
  className?: string
}

export function FastbookLogo({ className }: FastbookLogoProps) {
  return (
    <img
      className={classNames('fastbook-logo', className)}
      src={logoUrl}
      alt="fastbook"
      width={186}
      height={48}
    />
  )
}
