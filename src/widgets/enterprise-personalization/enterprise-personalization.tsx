import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { EnterpriseDashboardOutletContext } from '@src/pages/enterprise-dashboard/enterprise-dashboard.types'
import { getTenantBranding, updateTenantBranding } from '@src/lib/tenant-branding'
import { deleteTenantLogoByUrl, uploadTenantLogo } from '@src/lib/tenant-branding-storage'
import {
  draftFromTenant,
  draftToRowValues,
  type BrandingDraft,
} from '@src/lib/tenant-branding.utils'
import { UpgradeProModal } from '@src/widgets/enterprise-schedules/upgrade-pro-modal/upgrade-pro-modal'
import { BrandIdentityForm } from './brand-identity-form/brand-identity-form'
import { BrandPreview } from './brand-preview/brand-preview'
import type { BrandLogoState } from './enterprise-personalization.types'
import {
  convertLogoToWebp,
  logoRejectionMessage,
  validateLogoFile,
} from './enterprise-personalization.utils'
import './enterprise-personalization.css'

function logoStateFromUrl(url: string | null): BrandLogoState {
  return url ? { kind: 'remote', url } : null
}

function revokeLogoPreview(logo: BrandLogoState) {
  if (logo?.kind === 'local') {
    URL.revokeObjectURL(logo.previewUrl)
  }
}

export function EnterprisePersonalization() {
  const { tenant } = useOutletContext<EnterpriseDashboardOutletContext>()
  const queryClient = useQueryClient()

  const brandingQuery = useQuery({
    queryKey: ['tenant-branding', tenant.id],
    queryFn: () => getTenantBranding(tenant.id),
  })

  const [draft, setDraft] = useState<BrandingDraft | null>(null)
  const [logo, setLogo] = useState<BrandLogoState>(null)
  const [hydrated, setHydrated] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  if (brandingQuery.data && !hydrated) {
    setHydrated(true)
    setDraft(draftFromTenant(brandingQuery.data))
    setLogo(logoStateFromUrl(brandingQuery.data.logo_url))
  }

  useEffect(() => {
    return () => {
      revokeLogoPreview(logo)
    }
  }, [logo])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft || !brandingQuery.data) {
        throw new Error('La configuración aún no se ha cargado.')
      }

      const previousLogoUrl = brandingQuery.data.logo_url
      let nextLogoUrl: string | null = previousLogoUrl

      if (logo === null) {
        nextLogoUrl = null
      } else if (logo.kind === 'local') {
        nextLogoUrl = await uploadTenantLogo({
          tenantId: tenant.id,
          blob: logo.blob,
          mimeType: logo.mimeType,
        })
      }

      const saved = await updateTenantBranding(tenant.id, {
        logo_url: nextLogoUrl,
        ...draftToRowValues(draft),
      })

      if (previousLogoUrl && previousLogoUrl !== nextLogoUrl) {
        await deleteTenantLogoByUrl(previousLogoUrl).catch(() => undefined)
      }

      return saved
    },
    onSuccess: async (saved) => {
      setErrorMessage(null)
      setSuccessMessage('Personalización guardada. Ya está visible en tu página pública.')
      setLogo(logoStateFromUrl(saved.logo_url))
      queryClient.setQueryData(['tenant-branding', tenant.id], saved)
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenant.slug] })
    },
    onError: (error: Error) => {
      setSuccessMessage(null)
      setErrorMessage(error.message || 'No se pudo guardar la personalización.')
    },
  })

  async function handleLogoSelect(file: File) {
    setSuccessMessage(null)
    const validation = validateLogoFile(file)
    if (!validation.ok) {
      setErrorMessage(logoRejectionMessage(validation.reason))
      return
    }

    try {
      const converted = await convertLogoToWebp(file)
      setErrorMessage(null)
      setLogo({
        kind: 'local',
        blob: converted.blob,
        mimeType: converted.mimeType,
        previewUrl: URL.createObjectURL(converted.blob),
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo procesar el logo.')
    }
  }

  if (brandingQuery.isLoading || (brandingQuery.data && !draft)) {
    return (
      <div className="enterprise-personalization enterprise-personalization--loading">
        <p>Cargando personalización…</p>
      </div>
    )
  }

  if (brandingQuery.isError || !brandingQuery.data || !draft) {
    return (
      <div className="enterprise-personalization enterprise-personalization--error">
        <p>No se pudo cargar la personalización. Inténtalo de nuevo.</p>
        {brandingQuery.error?.message ? (
          <p className="enterprise-personalization__error-detail">
            {brandingQuery.error.message}
          </p>
        ) : null}
        <button
          type="button"
          className="enterprise-personalization__retry"
          onClick={() => {
            void brandingQuery.refetch()
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  const saved = brandingQuery.data
  const savedDraft = draftFromTenant(saved)
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(savedDraft) ||
    (logo?.kind === 'local') ||
    (logo === null) !== (saved.logo_url === null)
  const logoSrc = logo ? (logo.kind === 'remote' ? logo.url : logo.previewUrl) : null

  return (
    <div className="enterprise-personalization">
      <header className="enterprise-personalization__intro">
        <p className="enterprise-personalization__eyebrow">Tu marca</p>
        <h1 className="enterprise-personalization__heading">Personalización de tu página pública</h1>
        <p className="enterprise-personalization__lead">
          Sube tu logotipo, ajusta los colores corporativos y elige la tipografía de tu enlace de
          reservas.
        </p>
      </header>

      <div className="enterprise-personalization__grid">
        <BrandIdentityForm
          isPro={tenant.isPro}
          logo={logo}
          draft={draft}
          isDirty={isDirty}
          isSaving={saveMutation.isPending}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onLogoSelect={(file) => {
            void handleLogoSelect(file)
          }}
          onLogoRemove={() => {
            setLogo(null)
            setSuccessMessage(null)
          }}
          onDraftChange={(patch) => {
            setDraft({ ...draft, ...patch })
            setSuccessMessage(null)
          }}
          onReset={() => {
            setDraft(
              draftFromTenant({
                brand_primary: null,
                brand_secondary: null,
                brand_surface: null,
                brand_on_surface: null,
                brand_font: null,
                brand_logo_height: null,
              }),
            )
            setLogo(null)
            setSuccessMessage(null)
          }}
          onSave={() => {
            void saveMutation.mutateAsync().catch(() => undefined)
          }}
          onRequestUpgrade={() => {
            setUpgradeOpen(true)
          }}
        />

        <BrandPreview tenantName={tenant.name} logoSrc={logoSrc} draft={draft} />
      </div>

      <UpgradeProModal
        open={upgradeOpen}
        reason="branding"
        onClose={() => {
          setUpgradeOpen(false)
        }}
      />
    </div>
  )
}
