export const PHONE_COUNTRY_CODES = [
  { value: '+34', label: 'ES +34' },
  { value: '+351', label: 'PT +351' },
  { value: '+33', label: 'FR +33' },
  { value: '+44', label: 'UK +44' },
  { value: '+1', label: 'US +1' },
] as const

export type PhoneCountryCode = (typeof PHONE_COUNTRY_CODES)[number]['value']

export type CustomerDetailsFormValues = {
  fullName: string
  email: string
  phoneCountryCode: PhoneCountryCode
  phone: string
  notes: string
  privacyAccepted: boolean
  smsReminders: boolean
}

export type CustomerDetailsFormProps = {
  values: CustomerDetailsFormValues
  tenantName: string
  onChange: (patch: Partial<CustomerDetailsFormValues>) => void
}
