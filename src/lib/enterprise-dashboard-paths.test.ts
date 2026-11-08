import { describe, expect, it } from 'vitest'
import {
  enterpriseAgendaBookingPath,
  enterpriseDashboardPath,
  isEnterpriseDashboardSection,
} from './enterprise-dashboard-paths'

describe('enterpriseDashboardPath', () => {
  it('builds the agenda path by default', () => {
    expect(enterpriseDashboardPath('demo-salon')).toBe('/enterprise/demo-salon/agenda')
  })

  it('builds a section path', () => {
    expect(enterpriseDashboardPath('demo-salon', 'settings')).toBe(
      '/enterprise/demo-salon/settings',
    )
  })
})

describe('enterpriseAgendaBookingPath', () => {
  it('builds booking detail path', () => {
    expect(enterpriseAgendaBookingPath('demo-salon', 'b1')).toBe(
      '/enterprise/demo-salon/agenda/b1',
    )
  })
})

describe('isEnterpriseDashboardSection', () => {
  it('accepts known sections', () => {
    expect(isEnterpriseDashboardSection('agenda')).toBe(true)
    expect(isEnterpriseDashboardSection('schedules')).toBe(true)
    expect(isEnterpriseDashboardSection('personalization')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isEnterpriseDashboardSection('billing')).toBe(false)
    expect(isEnterpriseDashboardSection(undefined)).toBe(false)
  })
})
