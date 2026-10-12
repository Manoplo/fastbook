export type AgendaStatusFilter = 'all' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export type AgendaStatusFilterOption = {
  id: AgendaStatusFilter
  label: string
  tone: 'all' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
}
