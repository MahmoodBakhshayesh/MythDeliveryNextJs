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
  const [selectedOrderFilter, setSelectedOrderFilter] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [orderId, setOrderId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [timeSection, setTimeSection] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemWeightKg, setItemWeightKg] = useState("");
  const [itemVolumeM3, setItemVolumeM3] = useState("");
  const [planningStrategy, setPlanningStrategy] = useState<
    (typeof PLANNING_STRATEGIES)[number]
  >("SpatialCell");
  const [replaceExistingOrderIdsOnImport, setReplaceExistingOrderIdsOnImport] =
    useState(false);
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

  const filteredStops = (stopsQuery.data ?? []).filter((s) =>
    selectedOrderFilter ? (s.orderId ?? "") === selectedOrderFilter : true,
  );

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
    setOrderId("");
    setLatitude("");
    setLongitude("");
    setAddressLine1("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setCountry("");
    setPhone("");
    setTimeSection("");
    setNotes("");
    setExternalRef("");
    setItemSku("");
    setItemDescription("");
    setItemQuantity("1");
    setItemWeightKg("");
    setItemVolumeM3("");
    setPickedPoint(null);
  };

  const parseAddressParts = (displayAddress: string) => {
    const parts = displayAddress
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const first = parts[0] ?? "";
    const inferredCity = parts.length >= 2 ? parts[1] : "";
    const inferredRegion = parts.length >= 3 ? parts[2] : "";
    const inferredCountry = parts.length >= 4 ? parts[parts.length - 1] : "";
    const postalMatch = displayAddress.match(/\b\d{5,10}\b/);
    return {
      addressLine1: first,
      city: inferredCity,
      region: inferredRegion,
      country: inferredCountry,
      postalCode: postalMatch?.[0] ?? "",
    };
  };

  const applyReverseAddress = (data: {
    latitude: number;
    longitude: number;
    displayAddress: string;
    addressLine1?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string | null;
  }) => {
    setLatitude(String(data.latitude));
    setLongitude(String(data.longitude));

    const fallback = parseAddressParts(data.displayAddress ?? "");
    setAddressLine1((data.addressLine1 ?? "").trim() || fallback.addressLine1);
    setCity((data.city ?? "").trim() || fallback.city);
    setRegion((data.region ?? "").trim() || fallback.region);
    setPostalCode((data.postalCode ?? "").trim() || fallback.postalCode);
    setCountry((data.country ?? "").trim() || fallback.country);
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
      return res.body;
    },
    onSuccess: (data) => {
      applyReverseAddress(data);
      toast.success(data.displayAddress ? "Address filled from Map.ir." : "No address text returned.");
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

  const applyPickedPointMutation = useMutation({
    mutationFn: async () => {
      if (!pickedPoint) throw new Error("Pick a location on map first.");
      const res = await geocodingRepository.reverse(pickedPoint.lat, pickedPoint.lng);
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: (data) => {
      applyReverseAddress(data);
      setMapPickerOpen(false);
      toast.success("Location selected from map.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not resolve address for picked point."),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const name = recipientName.trim();
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      if (!effectiveOrgId || !name) {
        throw new Error("Organization and recipient name are required.");
      }
      if (selectedPlanId === ALL_PLANS) {
        throw new Error("Select a planning window before adding delivery stops.");
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Enter valid latitude and longitude.");
      }
      const quantity = Number.parseFloat(itemQuantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Item quantity must be greater than zero.");
      }
      const body: AddDeliveryStopBody = {
        organizationId: effectiveOrgId,
        planningWindowId: selectedPlanId || null,
        recipientName: name,
        orderId: orderId.trim() || null,
        latitude: lat,
        longitude: lng,
        phone: phone.trim() || null,
        addressLine1: addressLine1.trim() || null,
        city: city.trim() || null,
        region: region.trim() || null,
        postalCode: postalCode.trim() || null,
        country: country.trim() || null,
        timeSection: timeSection ? Number(timeSection) : null,
        notes: notes.trim() || null,
        externalRef: externalRef.trim() || null,
        lineItems: [
          {
            sku: itemSku.trim() || null,
            description: itemDescription.trim() || null,
            quantity,
            weightKg: itemWeightKg.trim() ? Number(itemWeightKg) : null,
            volumeM3: itemVolumeM3.trim() ? Number(itemVolumeM3) : null,
          },
        ],
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
      fd.append(
        "ReplaceExistingOrderIds",
        replaceExistingOrderIdsOnImport ? "true" : "false",
      );
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

  const downloadDeliveriesExcel = async () => {
    if (!effectiveOrgId) {
      toast.error("Select an organization.");
      return;
    }
    try {
      const blob = await deliveryImportsRepository.exportExcel(
        effectiveOrgId,
        selectedPlanId === ALL_PLANS ? null : selectedPlanId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        selectedPlanId === ALL_PLANS
          ? `deliveries-${effectiveOrgId}.xlsx`
          : `deliveries-${selectedPlanId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Deliveries exported.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    }
  };

  const downloadImportSchemaExcel = async () => {
    if (!effectiveOrgId) {
      toast.error("Select an organization.");
      return;
    }
    try {
      const blob = await deliveryImportsRepository.exportExcelImportSchema(
        effectiveOrgId,
        selectedPlanId === ALL_PLANS ? null : selectedPlanId,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        selectedPlanId === ALL_PLANS
          ? `deliveries-import-schema-${effectiveOrgId}.xlsx`
          : `deliveries-import-schema-${selectedPlanId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Import-schema deliveries exported.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
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
      filteredStops,
      selectedOrderFilter,
      orgsLoading: orgsQuery.isLoading,
      planningLoading: planningWindowsQuery.isLoading,
      stopsLoading: stopsQuery.isLoading,
      addDialogOpen,
      mapPickerOpen,
      pickedPoint,
      recipientName,
      orderId,
      latitude,
      longitude,
      addressLine1,
      city,
      region,
      postalCode,
      country,
      phone,
      timeSection,
      notes,
      externalRef,
      itemSku,
      itemDescription,
      itemQuantity,
      itemWeightKg,
      itemVolumeM3,
      timeSections: TIME_SECTIONS,
      planningStrategy,
      planningStrategies: PLANNING_STRATEGIES,
      replaceExistingOrderIdsOnImport,
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
      applyPickedPointPending: applyPickedPointMutation.isPending,
      driversZipPending: exportDriversZipMutation.isPending,
      deletePlanPending: deletePlanMutation.isPending,
      lastImport,
      fileInputRef,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setSelectedPlanId,
      setSelectedOrderFilter,
      clearOrderFilter: () => setSelectedOrderFilter(null),
      setAddDialogOpen,
      setMapPickerOpen,
      setPickedPoint,
      setRecipientName,
      setOrderId,
      setLatitude,
      setLongitude,
      setAddressLine1,
      setCity,
      setRegion,
      setPostalCode,
      setCountry,
      setPhone,
      setTimeSection,
      setNotes,
      setExternalRef,
      setItemSku,
      setItemDescription,
      setItemQuantity,
      setItemWeightKg,
      setItemVolumeM3,
      setPlanningStrategy,
      setReplaceExistingOrderIdsOnImport,
      submitAddStop: () => addMutation.mutate(),
      lookupAddressFromCoords: () => reverseFromCoordsMutation.mutate(),
      lookupCoordinatesFromAddress: () => geocodeSearchMutation.mutate(),
      applyPickedPoint: () => applyPickedPointMutation.mutate(),
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
      downloadImportSchemaExcel,
      downloadDeliveriesExcel,
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
        const lat = Number.parseFloat(latitude);
        const lng = Number.parseFloat(longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setPickedPoint({ lat, lng });
        }
        setAddDialogOpen(true);
      },
    },
  };
}

export type DeliveriesPageViewModel = ReturnType<
  typeof useDeliveriesPageController
>;
