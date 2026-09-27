import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from './calendar'
import { buildMonthGrid, isSameDay, startOfDay, toDateKey } from './calendar.utils'

describe('calendar.utils', () => {
  it('builds a Monday-start grid covering the full month', () => {
    const viewMonth = new Date(2024, 9, 1)
    const days = buildMonthGrid({
      viewMonth,
      selected: null,
      today: new Date(2024, 9, 10),
      minDate: new Date(2024, 9, 1),
      availableKeys: null,
    })

    expect(days.length % 7).toBe(0)
    expect(days[0]?.date.getDay()).toBe(1)
    expect(days.some((day) => day.dayNumber === 31 && day.isCurrentMonth)).toBe(
      true,
    )
  })

  it('marks only listed keys as available when a set is provided', () => {
    const available = new Date(2024, 9, 24)
    const days = buildMonthGrid({
      viewMonth: new Date(2024, 9, 1),
      selected: null,
      today: new Date(2024, 9, 1),
      minDate: new Date(2024, 9, 1),
      availableKeys: new Set([toDateKey(available)]),
    })

    const day24 = days.find(
      (day) => day.isCurrentMonth && day.dayNumber === 24,
    )
    const day25 = days.find(
      (day) => day.isCurrentMonth && day.dayNumber === 25,
    )

    expect(day24?.isAvailable).toBe(true)
    expect(day25?.isAvailable).toBe(false)
  })
})

describe('Calendar', () => {
  it('calls onChange with the selected day at start of day', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const selected = startOfDay(new Date(2026, 9, 15))
    const nextDay = startOfDay(new Date(2026, 9, 16))

    render(
      <Calendar
        value={selected}
        onChange={onChange}
        minDate={new Date(2026, 9, 1)}
        availableDates={[selected, nextDay]}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /16 de octubre de 2026/i }),
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    const result = onChange.mock.calls[0]?.[0] as Date
    expect(isSameDay(result, nextDay)).toBe(true)
  })

  it('keeps past days disabled within the current month', () => {
    const onChange = vi.fn()
    const today = startOfDay(new Date(2026, 9, 15))
    const pastInMonth = startOfDay(new Date(2026, 9, 10))

    render(
      <Calendar
        value={today}
        onChange={onChange}
        minDate={today}
        availableDates={[pastInMonth, today]}
      />,
    )

    const pastLabel = pastInMonth.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    expect(screen.getByRole('button', { name: pastLabel })).toBeDisabled()
  })

  it('navigates to the next month', async () => {
    const user = userEvent.setup()
    const fixed = new Date(2026, 5, 10)

    render(
      <Calendar
        value={fixed}
        minDate={new Date(2026, 5, 1)}
        onChange={() => {}}
      />,
    )

    expect(screen.getByText('Junio 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('Julio 2026')).toBeInTheDocument()
  })
})
