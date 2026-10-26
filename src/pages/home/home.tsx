import { LandingComparison } from './landing-comparison/landing-comparison'
import { LandingFinalCta } from './landing-final-cta/landing-final-cta'
import { LandingFooter } from './landing-footer/landing-footer'
import { LandingHeader } from './landing-header/landing-header'
import { LandingHero } from './landing-hero/landing-hero'
import { LandingPricing } from './landing-pricing/landing-pricing'
import { LandingSteps } from './landing-steps/landing-steps'
import './home.css'

export function HomePage() {
  return (
    <div className="home">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingSteps />
        <LandingComparison />
        <LandingPricing />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
