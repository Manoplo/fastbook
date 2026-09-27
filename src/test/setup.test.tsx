import { render, screen } from '@testing-library/react'

describe('vitest setup', () => {
  it('renders in jsdom with Testing Library matchers', () => {
    render(<p>Fastbook</p>)
    expect(screen.getByText('Fastbook')).toBeInTheDocument()
  })
})
