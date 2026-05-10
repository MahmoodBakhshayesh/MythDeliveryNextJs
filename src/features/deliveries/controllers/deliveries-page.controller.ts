"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  deliveryImportsRepository,
  type ImportJobResponseDto,
} from "@/features/deliveries/repositories/delivery-imports.repository";
import { listDeliveryStopsUseCase } from "@/features/deliveries/usecases/list-delivery-stops.usecase";
import type { AddDeliveryStopBody } from "@/features/map/domain/planning-map.types";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { addDeliveryStopUseCase } from "@/features/map/usecases/add-delivery-stop.usecase";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { routePlanningRepository } from "@/features/planning/repositories/route-planning.repository";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

const ALL_PLANS = "__all__";

export function useDeliveriesPageController() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(ALL_PLANS);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceMinutes, setServiceMinutes] = useState("10");
  const [lastImport, setLastImport] = useState<ImportJobResponseDto | null>(
    null,
  );

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    if (!selectedOrgId && firstOrgId) setSelectedOrgId(firstOrgId);
  }, [firstOrgId, selectedOrgId]);

  const effectiveOrgId = selectedOrgId || firstOrgId || "";

  const planningWindowsQuery = useQuery({
    queryKey: queryKeys.planningWindows(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listPlanningWindowsUseCase(effectiveOrgId),
  });

  const planningWindows = planningWindowsQuery.data;
  const planFilterForList =
    selectedPlanId === ALL_PLANS ? undefined : selectedPlanId;

  const stopsQuery = useQuery({
    queryKey: queryKeys.deliveryStops(
      effectiveOrgId || "_",
      planFilterForList ?? "all",
    ),
    enabled: !!effectiveOrgId,
    queryFn: () =>
      listDeliveryStopsUseCase(effectiveOrgId, planFilterForList),
  });

  useEffect(() => {
    if (!planningWindows?.length) return;
    if (selectedPlanId === ALL_PLANS) return;
    const stillValid = planningWindows.some((w) => w.id === selectedPlanId);
    if (!stillValid) setSelectedPlanId(ALL_PLANS);
  }, [planningWindows, selectedPlanId]);

  const resetAddForm = () => {
    setRecipientName("");
    setLatitude("");
    setLongitude("");
    setPhone("");
    setServiceMinutes("10");
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const name = recipientName.trim();
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      const mins = Number.parseInt(serviceMinutes, 10);
      if (!effectiveOrgId || !name) {
        throw new Error("Organization and recipient name are required.");
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Enter valid latitude and longitude.");
      }
      const body: AddDeliveryStopBody = {
        organizationId: effectiveOrgId,
        planningWindowId:
          selectedPlanId === ALL_PLANS ? null : selectedPlanId || null,
        recipientName: name,
        latitude: lat,
        longitude: lng,
        phone: phone.trim() || null,
        serviceMinutes: Number.isFinite(mins) ? mins : 10,
      };
      return addDeliveryStopUseCase(body);
    },
    onSuccess: async () => {
      toast.success("Delivery stop added.");
      setAddDialogOpen(false);
      resetAddForm();
      await queryClient.invalidateQueries({
        queryKey: ["delivery-stops", effectiveOrgId],
      });
      if (selectedPlanId !== ALL_PLANS) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.routes(selectedPlanId),
        });
      }
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not add delivery stop."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deliveryStopsRepository.delete(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success("Stop removed.");
      await queryClient.invalidateQueries({
        queryKey: ["delivery-stops", effectiveOrgId],
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not delete stop."),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("File", file);
      fd.append("OrganizationId", effectiveOrgId);
      if (selectedPlanId !== ALL_PLANS) {
        fd.append("PlanningWindowId", selectedPlanId);
      }
      const res = await deliveryImportsRepository.importExcel(fd);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async (job) => {
      setLastImport(job);
      toast.success(
        `Import finished: ${job.importedRows} / ${job.totalRows} rows.`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["delivery-stops", effectiveOrgId],
      });
      if (selectedPlanId !== ALL_PLANS) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.routes(selectedPlanId),
        });
      }
    },
    onError: (err: Error) => toast.error(err.message || "Import failed."),
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlanId === ALL_PLANS) {
        throw new Error("Select a planning window first.");
      }
      const res = await routePlanningRepository.generateDraftRoutes({
        planningWindowId: selectedPlanId,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async (data) => {
      toast.success(
        `Draft routes created: ${data.routesCreated}. ${data.messages?.join(" ") ?? ""}`,
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.routes(selectedPlanId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not generate routes."),
  });

  const downloadTemplate = async () => {
    try {
      const blob =
        await deliveryImportsRepository.downloadExcelTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "delivery-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    }
  };

  const onPickExcel = () => fileInputRef.current?.click();

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!effectiveOrgId) {
      toast.error("Select an organization.");
      return;
    }
    importMutation.mutate(file);
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      planningWindows: planningWindows ?? null,
      selectedPlanId,
      allPlansValue: ALL_PLANS,
      stops: stopsQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      planningLoading: planningWindowsQuery.isLoading,
      stopsLoading: stopsQuery.isLoading,
      addDialogOpen,
      recipientName,
      latitude,
      longitude,
      phone,
      serviceMinutes,
      addPending: addMutation.isPending,
      deletePending: deleteMutation.isPending,
      importPending: importMutation.isPending,
      draftPending: draftMutation.isPending,
      lastImport,
      fileInputRef,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setSelectedPlanId,
      setAddDialogOpen,
      setRecipientName,
      setLatitude,
      setLongitude,
      setPhone,
      setServiceMinutes,
      submitAddStop: () => addMutation.mutate(),
      deleteStop: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Remove this delivery stop?")
        )
          return;
        deleteMutation.mutate(id);
      },
      downloadTemplate,
      onPickExcel,
      onFileChange,
      generateDraftRoutes: () => draftMutation.mutate(),
      openAddDialog: () => {
        resetAddForm();
        setAddDialogOpen(true);
      },
    },
  };
}

export type DeliveriesPageViewModel = ReturnType<
  typeof useDeliveriesPageController
>;
