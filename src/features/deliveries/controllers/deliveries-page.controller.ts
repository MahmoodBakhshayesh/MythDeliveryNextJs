"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  deliveryImportsRepository,
  type ImportJobResponseDto,
} from "@/features/deliveries/repositories/delivery-imports.repository";
import { useAutoGeocodeFill } from "@/features/geocoding/hooks/use-auto-geocode-fill";
import { geocodingRepository } from "@/features/geocoding/repositories/geocoding.repository";
import { listDeliveryStopsUseCase } from "@/features/deliveries/usecases/list-delivery-stops.usecase";
import type { AddDeliveryStopBody } from "@/features/map/domain/planning-map.types";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { addDeliveryStopUseCase } from "@/features/map/usecases/add-delivery-stop.usecase";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { routePlanningRepository } from "@/features/planning/repositories/route-planning.repository";
import { deletePlanningWindowUseCase } from "@/features/planning/usecases/delete-planning-window.usecase";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import { useIsAdmin } from "@/lib/use-is-admin";

const ALL_PLANS = "__all__";
const PLANNING_STRATEGIES = [
  "SpatialCell",
  "LatitudeBands",
  "LongitudeBands",
  "RadialFromCentroid",
] as const;
const TIME_SECTIONS = [
  { value: 0, label: "00:00-06:00" },
  { value: 1, label: "06:00-12:00" },
  { value: 2, label: "12:00-18:00" },
  { value: 3, label: "18:00-24:00" },
] as const;

export function useDeliveriesPageController() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(ALL_PLANS);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceMinutes, setServiceMinutes] = useState("10");
  const [serviceDate, setServiceDate] = useState("");
  const [timeSection, setTimeSection] = useState<string>("");
  const [planningStrategy, setPlanningStrategy] = useState<
    (typeof PLANNING_STRATEGIES)[number]
  >("SpatialCell");
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
    const strategy = searchParams.get("strategy");
    if (
      strategy === "SpatialCell" ||
      strategy === "LatitudeBands" ||
      strategy === "LongitudeBands" ||
      strategy === "RadialFromCentroid"
    ) {
      setPlanningStrategy(strategy);
    }
    const planId = searchParams.get("planningWindowId");
    if (planId) setSelectedPlanId(planId);
    const orgId = searchParams.get("organizationId");
    if (orgId) setSelectedOrgId(orgId);
  }, [searchParams]);

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

  useAutoGeocodeFill({
    latitude,
    longitude,
    addressLine1,
    setLatitude,
    setLongitude,
    setAddressLine1,
    enabled: addDialogOpen,
  });

  const resetAddForm = () => {
    setRecipientName("");
    setLatitude("");
    setLongitude("");
    setAddressLine1("");
    setPhone("");
    setServiceMinutes("10");
    setServiceDate("");
    setTimeSection("");
  };

  const reverseFromCoordsMutation = useMutation({
    mutationFn: async () => {
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Enter valid latitude and longitude.");
      }
      const res = await geocodingRepository.reverse(lat, lng);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body.displayAddress?.trim() ?? "";
    },
    onSuccess: (addr) => {
      if (addr) setAddressLine1(addr);
      toast.success(addr ? "Address filled from Map.ir." : "No address text returned.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Reverse geocode failed."),
  });

  const geocodeSearchMutation = useMutation({
    mutationFn: async () => {
      const q = addressLine1.trim();
      if (!q) throw new Error("Enter an address or place name.");
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      const bias =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lng }
          : undefined;
      const res = await geocodingRepository.search(q, bias);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      const first = res.body.results?.[0];
      if (!first) throw new Error("No matching places.");
      return first;
    },
    onSuccess: (first) => {
      setLatitude(String(first.latitude));
      setLongitude(String(first.longitude));
      toast.success("Coordinates updated from Map.ir.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Search failed."),
  });

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
      if (timeSection && !serviceDate) {
        throw new Error("Set service date when time section is selected.");
      }
      const body: AddDeliveryStopBody = {
        organizationId: effectiveOrgId,
        planningWindowId:
          selectedPlanId === ALL_PLANS ? null : selectedPlanId || null,
        recipientName: name,
        latitude: lat,
        longitude: lng,
        phone: phone.trim() || null,
        addressLine1: addressLine1.trim() || null,
        serviceMinutes: Number.isFinite(mins) ? mins : 10,
        serviceDate: serviceDate || null,
        timeSection: timeSection ? Number(timeSection) : null,
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

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const currentStops = stopsQuery.data ?? [];
      if (currentStops.length === 0) return 0;
      const results = await Promise.all(
        currentStops.map((s) => deliveryStopsRepository.delete(s.id)),
      );
      const failed = results.filter((r) => !isAppSuccess(r));
      if (failed.length) {
        throw new Error(
          `Deleted ${currentStops.length - failed.length}/${currentStops.length}. ${failed[0]?.message ?? "Some deletions failed."}`,
        );
      }
      return currentStops.length;
    },
    onSuccess: async (count) => {
      toast.success(`Removed ${count} delivery stops.`);
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
      toast.error(err.message || "Could not delete all stops."),
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
        planningStrategy,
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

  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlanId === ALL_PLANS) {
        throw new Error("Select a planning window first.");
      }
      await deletePlanningWindowUseCase(selectedPlanId);
    },
    onSuccess: async () => {
      toast.success("Planning window deleted.");
      setSelectedPlanId(ALL_PLANS);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["delivery-stops", effectiveOrgId],
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not delete planning window."),
  });

  const exportInstructionsMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlanId === ALL_PLANS) {
        throw new Error("Select a planning window first.");
      }
      const res = await routePlanningRepository.getDriverInstructions(selectedPlanId);
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-instructions-${data.planningWindowId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Driver instructions exported.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not export instructions."),
  });

  const exportFleetPdfMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlanId === ALL_PLANS) throw new Error("Select a planning window first.");
      return routePlanningRepository.downloadFleetReportPdf(selectedPlanId);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-report-${selectedPlanId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fleet report downloaded.");
    },
    onError: (err: Error) => toast.error(err.message || "Could not download fleet PDF."),
  });

  const exportDriversZipMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlanId === ALL_PLANS) throw new Error("Select a planning window first.");
      return routePlanningRepository.downloadDriverReportsZip(selectedPlanId);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-reports-${selectedPlanId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Driver reports downloaded.");
    },
    onError: (err: Error) => toast.error(err.message || "Could not download driver ZIP."),
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
      addressLine1,
      phone,
      serviceMinutes,
      serviceDate,
      timeSection,
      timeSections: TIME_SECTIONS,
      planningStrategy,
      planningStrategies: PLANNING_STRATEGIES,
      isAdmin,
      addPending: addMutation.isPending,
      deletePending: deleteMutation.isPending,
      deleteAllPending: deleteAllMutation.isPending,
      importPending: importMutation.isPending,
      draftPending: draftMutation.isPending,
      exportPending: exportInstructionsMutation.isPending,
      fleetPdfPending: exportFleetPdfMutation.isPending,
      reverseGeocodePending: reverseFromCoordsMutation.isPending,
      geocodeSearchPending: geocodeSearchMutation.isPending,
      driversZipPending: exportDriversZipMutation.isPending,
      deletePlanPending: deletePlanMutation.isPending,
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
      setAddressLine1,
      setPhone,
      setServiceMinutes,
      setServiceDate,
      setTimeSection,
      setPlanningStrategy,
      submitAddStop: () => addMutation.mutate(),
      lookupAddressFromCoords: () => reverseFromCoordsMutation.mutate(),
      lookupCoordinatesFromAddress: () => geocodeSearchMutation.mutate(),
      deleteStop: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Remove this delivery stop?")
        )
          return;
        deleteMutation.mutate(id);
      },
      deleteAllStops: () => {
        const currentCount = stopsQuery.data?.length ?? 0;
        if (currentCount === 0) return;
        if (
          typeof window !== "undefined" &&
          !window.confirm(`Delete all ${currentCount} stops in current list?`)
        )
          return;
        deleteAllMutation.mutate();
      },
      downloadTemplate,
      onPickExcel,
      onFileChange,
      generateDraftRoutes: () => draftMutation.mutate(),
      exportDriverInstructions: () => exportInstructionsMutation.mutate(),
      exportFleetPdf: () => exportFleetPdfMutation.mutate(),
      exportDriversZip: () => exportDriversZipMutation.mutate(),
      deleteSelectedPlan: () => {
        if (selectedPlanId === ALL_PLANS) {
          toast.error("Select a planning window first.");
          return;
        }
        if (
          typeof window !== "undefined" &&
          !window.confirm("Delete selected planning window?")
        )
          return;
        deletePlanMutation.mutate();
      },
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
