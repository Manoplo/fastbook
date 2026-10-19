import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ConfirmModal } from "@components/confirm-modal/confirm-modal";
import type { EnterpriseDashboardOutletContext } from "@src/pages/enterprise-dashboard/enterprise-dashboard.types";
import {
  deleteAllServiceImages,
  syncServiceGallery,
} from "@src/lib/service-images-storage";
import {
  hydrateRemoteImagesFromUrls,
  revokeLocalPreviewUrls,
  type ServiceImageItem,
} from "@src/lib/service-images-storage.utils";
import { listTenantAvailability, replaceTenantAvailability } from "@src/lib/tenant-availability";
import {
  createTenantService,
  deleteTenantService,
  listTenantServices,
  updateTenantService,
  type TenantServiceRow,
} from "@src/lib/tenant-services";
import { ServiceImagesModal } from "./service-images-modal/service-images-modal";
import type { ServiceGallerySavePayload } from "./service-images-modal/service-images-modal.types";
import { ServicesCatalog } from "./services-catalog/services-catalog";
import { UpgradeProModal } from "./upgrade-pro-modal/upgrade-pro-modal";
import { WeeklyScheduleEditor } from "./weekly-schedule-editor/weekly-schedule-editor";
import type { DayScheduleDraft, ServiceFormValues, UpgradeProReason } from "./enterprise-schedules.types";
import {
  EMPTY_SERVICE_FORM,
  buildWeekDraftFromRows,
  canAddService,
  copyWeekdaysToAll,
  createEmptyWeekDraft,
  flattenWeekDraft,
  parseServiceFormValues,
  serviceToFormValues,
  validateWeekDraft,
} from "./enterprise-schedules.utils";
import "./enterprise-schedules.css";

type PendingGallery = {
  items: ServiceImageItem[];
  youtubeUrl: string;
};

type ImagesModalContext = {
  serviceId: string | null;
  label: string;
  initialItems: ServiceImageItem[];
  initialYoutubeUrl: string;
};

export function EnterpriseSchedules() {
  const { tenant } = useOutletContext<EnterpriseDashboardOutletContext>();
  const queryClient = useQueryClient();

  const [days, setDays] = useState<DayScheduleDraft[]>(createEmptyWeekDraft);
  const [scheduleHydrated, setScheduleHydrated] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ServiceFormValues>(EMPTY_SERVICE_FORM);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeProReason>("service_limit");
  const [serviceToDelete, setServiceToDelete] = useState<TenantServiceRow | null>(null);

  const [pendingGallery, setPendingGallery] = useState<PendingGallery | null>(null);
  const [imagesModal, setImagesModal] = useState<ImagesModalContext | null>(null);
  const [gallerySaving, setGallerySaving] = useState(false);

  const availabilityQuery = useQuery({
    queryKey: ["tenant-availability", tenant.id],
    queryFn: () => listTenantAvailability(tenant.id),
  });

  const servicesQuery = useQuery({
    queryKey: ["tenant-services", tenant.id],
    queryFn: () => listTenantServices(tenant.id),
  });

  if (availabilityQuery.data && !scheduleHydrated) {
    setScheduleHydrated(true);
    setDays(buildWeekDraftFromRows(availabilityQuery.data));
  }

  function clearPendingGallery() {
    if (pendingGallery) {
      revokeLocalPreviewUrls(pendingGallery.items);
    }
    setPendingGallery(null);
  }

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const validationError = validateWeekDraft(days);
      if (validationError) {
        throw new Error(validationError.message);
      }
      return replaceTenantAvailability(tenant.id, flattenWeekDraft(days));
    },
    onSuccess: async (rows) => {
      setScheduleError(null);
      setDays(buildWeekDraftFromRows(rows));
      await queryClient.invalidateQueries({ queryKey: ["tenant-availability", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenant.slug] });
    },
    onError: (error: Error) => {
      setScheduleError(error.message || "No se pudieron guardar los horarios.");
    },
  });

  const saveServiceMutation = useMutation({
    mutationFn: async (): Promise<{ softGalleryError?: string }> => {
      const parsed = parseServiceFormValues(formValues);
      if (!parsed) {
        throw new Error("Revisa nombre, duración y precio del servicio.");
      }

      const services = servicesQuery.data ?? [];

      if (editingServiceId === "new") {
        if (!canAddService({ isPro: tenant.isPro, serviceCount: services.length })) {
          setUpgradeReason("service_limit");
          setUpgradeOpen(true);
          throw new Error("Límite del plan gratuito alcanzado.");
        }

        const created = await createTenantService({
          tenantId: tenant.id,
          name: parsed.name,
          price: parsed.price,
          durationMinutes: parsed.durationMinutes,
          description: parsed.description,
          active: parsed.active,
        });

        const gallery = pendingGallery;
        if (!gallery || (gallery.items.length === 0 && !gallery.youtubeUrl.trim())) {
          return {};
        }

        try {
          await syncServiceGallery({
            tenantId: tenant.id,
            serviceId: created.id,
            items: gallery.items,
            initialRemotePaths: [],
            youtubeUrl: gallery.youtubeUrl,
          });
          revokeLocalPreviewUrls(gallery.items);
          setPendingGallery(null);
          return {};
        } catch (error) {
          revokeLocalPreviewUrls(gallery.items);
          setPendingGallery(null);
          return {
            softGalleryError:
              error instanceof Error
                ? error.message
                : "No se pudieron subir las imágenes.",
          };
        }
      }

      if (!editingServiceId) {
        throw new Error("No hay servicio seleccionado.");
      }

      await updateTenantService({
        id: editingServiceId,
        name: parsed.name,
        price: parsed.price,
        durationMinutes: parsed.durationMinutes,
        description: parsed.description,
        active: parsed.active,
      });
      return {};
    },
    onSuccess: async (result) => {
      setEditingServiceId(null);
      setFormValues(EMPTY_SERVICE_FORM);
      await queryClient.invalidateQueries({ queryKey: ["tenant-services", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenant.slug] });

      if (result.softGalleryError) {
        setServiceError(
          `Servicio creado, pero no se pudieron subir las imágenes (${result.softGalleryError}). Ábrelo desde la card para reintentar.`,
        );
        return;
      }
      setServiceError(null);
    },
    onError: (error: Error) => {
      if (error.message.includes("Límite del plan")) {
        setServiceError(null);
        return;
      }
      setServiceError(error.message || "No se pudo guardar el servicio.");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (service: TenantServiceRow) => {
      await deleteTenantService(service.id);
      await deleteAllServiceImages({
        tenantId: tenant.id,
        serviceId: service.id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant-services", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenant.slug] });
    },
  });

  function openUpgrade(reason: UpgradeProReason) {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  }

  function handleStartCreate() {
    const services = servicesQuery.data ?? [];
    if (!canAddService({ isPro: tenant.isPro, serviceCount: services.length })) {
      openUpgrade("service_limit");
      return;
    }
    clearPendingGallery();
    setEditingServiceId("new");
    setFormValues(EMPTY_SERVICE_FORM);
    setServiceError(null);
  }

  function handleStartEdit(service: TenantServiceRow) {
    clearPendingGallery();
    setEditingServiceId(service.id);
    setFormValues(serviceToFormValues(service));
    setServiceError(null);
  }

  function handleCancelEdit() {
    clearPendingGallery();
    setEditingServiceId(null);
    setFormValues(EMPTY_SERVICE_FORM);
    setServiceError(null);
  }

  function handleDelete(service: TenantServiceRow) {
    setServiceToDelete(service);
  }

  function handleOpenServiceImages(service: TenantServiceRow | null) {
    if (service) {
      setImagesModal({
        serviceId: service.id,
        label: service.name,
        initialItems: hydrateRemoteImagesFromUrls(service.image_urls ?? []),
        initialYoutubeUrl: service.youtube_url ?? "",
      });
      return;
    }

    setImagesModal({
      serviceId: null,
      label: editingServiceId === "new" ? "Nuevo servicio" : "Servicio",
      initialItems: pendingGallery?.items ?? [],
      initialYoutubeUrl: pendingGallery?.youtubeUrl ?? "",
    });
  }

  async function handleGallerySave(payload: ServiceGallerySavePayload) {
    if (!imagesModal) {
      return;
    }

    if (!imagesModal.serviceId) {
      setPendingGallery({
        items: payload.items,
        youtubeUrl: payload.youtubeUrl,
      });
      setImagesModal(null);
      return;
    }

    setGallerySaving(true);
    try {
      await syncServiceGallery({
        tenantId: tenant.id,
        serviceId: imagesModal.serviceId,
        items: payload.items,
        initialRemotePaths: payload.initialRemotePaths,
        youtubeUrl: payload.youtubeUrl,
      });
      revokeLocalPreviewUrls(payload.items);
      setImagesModal(null);
      await queryClient.invalidateQueries({ queryKey: ["tenant-services", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenant.slug] });
    } finally {
      setGallerySaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!serviceToDelete) {
      return;
    }

    const deletedId = serviceToDelete.id;
    await deleteServiceMutation.mutateAsync(serviceToDelete);
    setServiceToDelete(null);

    if (editingServiceId === deletedId) {
      clearPendingGallery();
      setEditingServiceId(null);
      setFormValues(EMPTY_SERVICE_FORM);
      setServiceError(null);
    }
  }

  const isLoading = availabilityQuery.isLoading || servicesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="enterprise-schedules enterprise-schedules--loading">
        <p>Cargando horarios y servicios…</p>
      </div>
    );
  }

  if (availabilityQuery.isError || servicesQuery.isError) {
    return (
      <div className="enterprise-schedules enterprise-schedules--error">
        <p>No se pudo cargar la configuración. Inténtalo de nuevo.</p>
      </div>
    );
  }

  return (
    <div className="enterprise-schedules">
      <header className="enterprise-schedules__intro">
        <p className="enterprise-schedules__eyebrow">Gestión operativa</p>
        <h1 className="enterprise-schedules__heading">Configuración de disponibilidad y servicios</h1>
        <p className="enterprise-schedules__lead">
          Define los días activos, tramos horarios y catálogo de servicios de tu negocio.
        </p>
      </header>

      <div className="enterprise-schedules__grid">
        <WeeklyScheduleEditor
          days={days}
          isSaving={saveScheduleMutation.isPending}
          errorMessage={scheduleError}
          onChange={(next) => {
            setDays(next);
            setScheduleError(null);
          }}
          onCopyWeekdays={() => {
            setDays(copyWeekdaysToAll(days));
            setScheduleError(null);
          }}
          onSave={() => {
            void saveScheduleMutation.mutateAsync();
          }}
        />

        <ServicesCatalog
          services={servicesQuery.data ?? []}
          isPro={tenant.isPro}
          isSaving={saveServiceMutation.isPending}
          errorMessage={serviceError}
          editingServiceId={editingServiceId}
          formValues={formValues}
          onFormChange={setFormValues}
          onStartCreate={handleStartCreate}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSubmit={() => {
            void saveServiceMutation.mutateAsync();
          }}
          onDelete={handleDelete}
          onRequestUpgrade={openUpgrade}
          onOpenServiceImages={handleOpenServiceImages}
        />
      </div>

      <UpgradeProModal
        open={upgradeOpen}
        reason={upgradeReason}
        onClose={() => {
          setUpgradeOpen(false);
        }}
      />

      {imagesModal ? (
        <ServiceImagesModal
          key={`${imagesModal.serviceId ?? "new"}:${imagesModal.label}`}
          open
          serviceLabel={imagesModal.label}
          initialItems={imagesModal.initialItems}
          initialYoutubeUrl={imagesModal.initialYoutubeUrl}
          isSaving={gallerySaving}
          onClose={() => {
            if (!gallerySaving) {
              setImagesModal(null);
            }
          }}
          onSave={handleGallerySave}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(serviceToDelete)}
        title="Eliminar servicio"
        description={
          serviceToDelete
            ? `¿Eliminar el servicio “${serviceToDelete.name}”? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmingLabel="Eliminando…"
        cancelLabel="Cancelar"
        tone="danger"
        isConfirming={deleteServiceMutation.isPending}
        onCancel={() => {
          if (!deleteServiceMutation.isPending) {
            setServiceToDelete(null);
          }
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
