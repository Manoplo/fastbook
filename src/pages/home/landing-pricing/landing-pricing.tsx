import classNames from 'classnames'
import { Link } from 'react-router-dom'
import { CheckIcon } from '@components/icons/check-icon'
import { FREE_FEATURES, LOGIN_PATH, PRO_FEATURES } from '../home.constants'
import { Reveal } from '../reveal/reveal'
import './landing-pricing.css'

type Plan = {
  name: string
  price: string
  tagline: string
  features: readonly string[]
  cta: string
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Gratis',
    price: '0€',
    tagline: 'Para empezar a recibir reservas.',
    features: FREE_FEATURES,
    cta: 'Empezar gratis',
  },
  {
    name: 'Pro',
    price: '18€',
    tagline: 'Para negocios que quieren destacar.',
    features: PRO_FEATURES,
    cta: 'Elegir Pro',
    highlighted: true,
  },
]

export function LandingPricing() {
  return (
    <section id="precios" className="landing-pricing">
      <div className="landing-pricing__inner">
        <Reveal className="landing-pricing__heading">
          <p className="landing-eyebrow">Precios</p>
          <h2 className="landing-title">Empieza gratis. Crece cuando quieras.</h2>
        </Reveal>
        <div className="landing-pricing__plans">
          {PLANS.map((plan, index) => (
            <Reveal
              as="article"
              key={plan.name}
              delay={index * 120}
              className={classNames('landing-pricing__plan', {
                'landing-pricing__plan--highlighted': plan.highlighted,
              })}
            >
              <div className="landing-pricing__plan-head">
                <div>
                  <h3 className="landing-pricing__plan-name">{plan.name}</h3>
                  <p className="landing-pricing__plan-tagline">{plan.tagline}</p>
                </div>
                {plan.highlighted && (
                  <span className="landing-pricing__badge">Recomendado</span>
                )}
              </div>
              <p className="landing-pricing__price">
                <span className="landing-pricing__amount">{plan.price}</span>
                <span className="landing-pricing__period">/mes</span>
              </p>
              <ul className="landing-pricing__features">
                {plan.features.map((feature) => (
                  <li key={feature} className="landing-pricing__feature">
                    <CheckIcon className="landing-pricing__check" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                className={classNames(
                  'landing-btn',
                  plan.highlighted ? 'landing-btn--light' : 'landing-btn--outline-primary',
                )}
                to={LOGIN_PATH}
              >
                {plan.cta}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
