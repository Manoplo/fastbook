import type { EnterpriseSectionPlaceholderProps } from './enterprise-section-placeholder.types'
import './enterprise-section-placeholder.css'

export function EnterpriseSectionPlaceholder({
  title,
  description,
}: EnterpriseSectionPlaceholderProps) {
  return (
    <section className="enterprise-section-placeholder">
      <p className="enterprise-section-placeholder__eyebrow">Próximamente</p>
      <h2 className="enterprise-section-placeholder__title">{title}</h2>
      <p className="enterprise-section-placeholder__text">{description}</p>
    </section>
  )
}
