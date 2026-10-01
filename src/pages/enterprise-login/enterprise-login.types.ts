export type EnterpriseAuthMode = 'login' | 'signup' | 'complete'

export type EnterpriseLoginFormValues = {
  email: string
  password: string
  confirmPassword: string
  name: string
  slug: string
}
