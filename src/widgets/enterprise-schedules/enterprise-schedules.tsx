import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ConfirmModal } from "@components/confirm-modal/confirm-modal";
import type { EnterpriseDashboardOutletContext } from "@src/pages/enterprise-dashboard/enterprise-dashboard.types";
import { listTenantAvailability, replaceTenantAvailability } from "@src/lib/tenant-availability";
import {
  createTenantService,
  deleteTenantService,
  listTenantServices,
  updateTenantService,
  type TenantServiceRow,
} from "@src/lib/tenant-services";
import { ServiceImagesModal } from "./service-images-modal/service-images-modal";
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
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [imagesModalLabel, setImagesModalLabel] = useState<string | undefined>(undefined);

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
    mutationFn: async () => {
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
        return createTenantService({
          tenantId: tenant.id,
          name: parsed.name,
          price: parsed.price,
          durationMinutes: parsed.durationMinutes,
          description: parsed.description,
          active: parsed.active,
        });
      }

      if (!editingServiceId) {
        throw new Error("No hay servicio seleccionado.");
      }

      return updateTenantService({
        id: editingServiceId,
        name: parsed.name,
        price: parsed.price,
        durationMinutes: parsed.durationMinutes,
        description: parsed.description,
        active: parsed.active,
      });
    },
    onSuccess: async () => {
      setServiceError(null);
      setEditingServiceId(null);
      setFormValues(EMPTY_SERVICE_FORM);
      await queryClient.invalidateQueries({ queryKey: ["tenant-services", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["tenant", tenant.slug] });
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
    mutationFn: (serviceId: string) => deleteTenantService(serviceId),
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
    setEditingServiceId("new");
    setFormValues(EMPTY_SERVICE_FORM);
    setServiceError(null);
  }

  function handleStartEdit(service: TenantServiceRow) {
    setEditingServiceId(service.id);
    setFormValues(serviceToFormValues(service));
    setServiceError(null);
  }

  function handleDelete(service: TenantServiceRow) {
    setServiceToDelete(service);
  }

  function handleOpenServiceImages(service: TenantServiceRow | null) {
    setImagesModalLabel(service?.name ?? (editingServiceId === "new" ? "Nuevo servicio" : undefined));
    setImagesModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!serviceToDelete) {
      return;
    }

    const deletedId = serviceToDelete.id;
    await deleteServiceMutation.mutateAsync(deletedId);

    if (editingServiceId === deletedId) {
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
          onCancelEdit={() => {
            setEditingServiceId(null);
            setFormValues(EMPTY_SERVICE_FORM);
            setServiceError(null);
          }}
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

      <ServiceImagesModal
        open={imagesModalOpen}
        serviceLabel={imagesModalLabel}
        onClose={() => {
          setImagesModalOpen(false);
        }}
      />

      <ConfirmModal
        open={Boolean(serviceToDelete)}
        title="Eliminar servicio"
        description={
          serviceToDelete ? `¿Eliminar el servicio “${serviceToDelete.name}”? Esta acción no se puede deshacer.` : ""
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
