import { CheckIcon } from '@components/icons/check-icon'
import { COMPARISON_ROWS, type ComparisonValue } from '../home.constants'
import { Reveal } from '../reveal/reveal'
import './landing-comparison.css'

type ComparisonCellProps = {
  value: ComparisonValue
}

function ComparisonCell({ value }: ComparisonCellProps) {
  if (value === true) {
    return (
      <>
        <CheckIcon className="landing-comparison__check" />
        <span className="landing-comparison__sr">Incluido</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="landing-comparison__sr">No incluido</span>
      </>
    )
  }
  return <span className="landing-comparison__text">{value}</span>
}

export function LandingComparison() {
  return (
    <section id="ventajas" className="landing-comparison landing-container">
      <Reveal className="landing-comparison__heading">
        <p className="landing-eyebrow">Ventajas</p>
        <h2 className="landing-title">Todo lo que necesitas, nada que sobre</h2>
      </Reveal>
      <Reveal className="landing-comparison__scroll" delay={100}>
        <table className="landing-comparison__table">
          <thead>
            <tr>
              <th className="landing-comparison__th landing-comparison__th--label" scope="col">
                Qué incluye
              </th>
              <th className="landing-comparison__th" scope="col">
                Gratis
              </th>
              <th className="landing-comparison__th landing-comparison__th--pro" scope="col">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="landing-comparison__row">
                <th className="landing-comparison__label" scope="row">
                  {row.label}
                </th>
                <td className="landing-comparison__cell">
                  <ComparisonCell value={row.free} />
                </td>
                <td className="landing-comparison__cell landing-comparison__cell--pro">
                  <ComparisonCell value={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </section>
  )
}
