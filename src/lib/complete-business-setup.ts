import { createOwnedTenant } from './ensure-owned-tenant'
import type { OwnedTenant } from './get-tenant-by-owner'
import { getAuthUser } from './auth-session'
import { TenantAuthError } from './tenant-auth.utils'

export type CompleteBusinessSetupInput = {
  name: string
  slug: string
}

export async function completeBusinessSetup(
  input: CompleteBusinessSetupInput,
): Promise<OwnedTenant> {
  const user = await getAuthUser()
  if (!user) {
    throw new TenantAuthError(
      'validation',
      'Inicia sesión para completar el alta de tu negocio.',
    )
  }

  return createOwnedTenant({
    ownerId: user.id,
    name: input.name,
    slug: input.slug,
  })
}
