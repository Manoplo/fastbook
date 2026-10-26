import { HOME_STEPS } from '../home.constants'
import { Reveal } from '../reveal/reveal'
import './landing-steps.css'

export function LandingSteps() {
  return (
    <section className="landing-steps">
      <div className="landing-steps__inner landing-container">
        <Reveal className="landing-steps__heading">
          <p className="landing-eyebrow">Cómo funciona</p>
          <h2 className="landing-title">De cero a reservas en tres pasos</h2>
        </Reveal>
        <ol className="landing-steps__list">
          {HOME_STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} className="landing-steps__item" delay={index * 120}>
              <span className="landing-steps__number">{index + 1}</span>
              <h3 className="landing-steps__item-title">{step.title}</h3>
              <p className="landing-steps__item-body">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
