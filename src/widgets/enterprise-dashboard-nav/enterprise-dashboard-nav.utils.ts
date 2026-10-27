import { BarChartIcon } from '@components/icons/bar-chart-icon'
import { CalendarMonthIcon } from '@components/icons/calendar-month-icon'
import { PaletteIcon } from '@components/icons/palette-icon'
import { ScheduleIcon } from '@components/icons/schedule-icon'
import { SettingsIcon } from '@components/icons/settings-icon'
import type { EnterpriseDashboardNavItem } from './enterprise-dashboard-nav.types'

export const ENTERPRISE_DASHBOARD_NAV_ITEMS: EnterpriseDashboardNavItem[] = [
  {
    section: 'agenda',
    label: 'Agenda y Citas',
    Icon: CalendarMonthIcon,
  },
  {
    section: 'schedules',
    label: 'Horarios y Servicios',
    Icon: ScheduleIcon,
  },
  {
    section: 'metrics',
    label: 'Métricas y Análisis',
    Icon: BarChartIcon,
  },
  {
    section: 'personalization',
    label: 'Personalización',
    Icon: PaletteIcon,
  },
  {
    section: 'settings',
    label: 'Ajustes de Negocio',
    Icon: SettingsIcon,
  },
]
