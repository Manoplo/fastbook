export type ServiceListItem = {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  tags: string[] | null
  duration_minutes: number
}

export type ServiceListProps = {
  services: ServiceListItem[]
  value?: string | null
  onChange?: (serviceId: string | null) => void
  eyebrow?: string
  title?: string
  subtitle?: string
}
