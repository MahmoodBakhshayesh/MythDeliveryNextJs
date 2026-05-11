"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  AddDeliveryStopBody,
  PlanningWindowResponseDto,
} from "@/features/map/domain/planning-map.types";
import {
  POLYGON_REGION_STORAGE_KEY,
  type PolygonRegionAlgorithm,
  type UpdateDeliveryStopBody,
} from "@/features/map/domain/planning-map.types";
import { planningWindowsRepository } from "@/features/map/repositories/planning-windows.repository";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { planningRouteEditsRepository } from "@/features/map/repositories/planning-route-edits.repository";
import { addDeliveryStopUseCase } from "@/features/map/usecases/add-delivery-stop.usecase";
import { loadPlanningMapUseCase } from "@/features/map/usecases/load-planning-map.usecase";
import { buildMapOverlay } from "@/features/map/lib/build-map-overlay";
import type { AddDriverVehicleAssignmentBody } from "@/features/drivers/domain/driver.types";
import { driverVehicleAssignmentsRepository } from "@/features/drivers/repositories/driver-vehicle-assignments.repository";
import { listDriverVehicleAssignmentsUseCase } from "@/features/drivers/usecases/list-driver-vehicle-assignments.usecase";
import { listDriversUseCase } from "@/features/drivers/usecases/list-drivers.usecase";
import { listVehiclesUseCase } from "@/features/fleet/usecases/list-vehicles.usecase";
import {
  deliveryImportsRepository,
  type ImportJobResponseDto,
} from "@/features/deliveries/repositories/delivery-imports.repository";
import { listDeliveryStopsUseCase } from "@/features/deliveries/usecases/list-delivery-stops.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listDistributionCentersUseCase } from "@/features/distribution-centers/usecases/list-distribution-centers.usecase";
import { routePlanningRepository } from "@/features/planning/repositories/route-planning.repository";
import { workPlansRepository } from "@/features/work-plans/repositories/work-plans.repository";
import { useAutoGeocodeFill } from "@/features/geocoding/hooks/use-auto-geocode-fill";
import { geocodingRepository } from "@/features/geocoding/repositories/geocoding.repository";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export const PLAN_WORKFLOW_STEPS = 6;

export const PLANNING_STRATEGIES = [
  "SpatialCell",
  "LatitudeBands",
  "LongitudeBands",
  "RadialFromCentroid",
] as const;

export const TIME_SECTIONS = [
  { value: 0, label: "00:00–06:00" },
  { value: 1, label: "06:00–12:00" },
  { value: 2, label: "12:00–18:00" },
  { value: 3, label: "18:00–24:00" },
] as const;

function toLocalDatetimeInput(iso: string): string {
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function usePlanWorkflowController() {
  const queryClient = useQueryClient();
  const tStop = useTranslations("UiRouteEdit");
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planName, setPlanName] = useState("");
  const [timeZoneId, setTimeZoneId] = useState("");
  const [planId, setPlanId] = useState("");

  const [planningStrategy, setPlanningStrategy] = useState<
    (typeof PLANNING_STRATEGIES)[number]
  >("SpatialCell");
  const [polygonAlgorithm, setPolygonAlgorithm] =
    useState<PolygonRegionAlgorithm>("convexHull");

  const [assignmentDriverId, setAssignmentDriverId] = useState("");
  const [assignmentVehicleId, setAssignmentVehicleId] = useState("");
  const [assignmentFromLocal, setAssignmentFromLocal] = useState("");
  const [selectedRouteDriverIds, setSelectedRouteDriverIds] = useState<string[]>([]);

  const [selectedWorkPlanId, setSelectedWorkPlanId] = useState("");
  const [selectedDistributionCenterId, setSelectedDistributionCenterId] =
    useState("");
  const [driverShiftOrdinalByDriverId, setDriverShiftOrdinalByDriverId] = useState<
    Record<string, string>
  >({});

  const [recipientName, setRecipientName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [timeSection, setTimeSection] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");

  const [lastImport, setLastImport] = useState<ImportJobResponseDto | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(POLYGON_REGION_STORAGE_KEY, polygonAlgorithm);
    } catch {
      /* ignore */
    }
  }, [polygonAlgorithm]);

  useEffect(() => {
    if (timeZoneId.trim()) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimeZoneId(tz);
    } catch {
      /* ignore */
    }
  }, [timeZoneId]);

  useEffect(() => {
    setDriverShiftOrdinalByDriverId({});
  }, [planId]);

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    const orgQ = searchParams.get("organizationId");
    const planQ = searchParams.get("planningWindowId");
    if (orgQ) setSelectedOrgId(orgQ);
    if (planQ) setPlanId(planQ);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedOrgId && firstOrgId) setSelectedOrgId(firstOrgId);
  }, [firstOrgId, selectedOrgId]);

  useEffect(() => {
    if (planDate) return;
    const t = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setPlanDate(
      `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    );
  }, [planDate]);

  useEffect(() => {
    if (!planName && planDate)
      setPlanName(`Fleet plan ${planDate}`);
  }, [planDate, planName]);

  const effectiveOrgId = selectedOrgId || firstOrgId || "";

  const workPlansQuery = useQuery({
    queryKey: queryKeys.workPlans(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: async () => {
      const res = await workPlansRepository.list(effectiveOrgId);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
  });

  const distributionCentersQuery = useQuery({
    queryKey: queryKeys.distributionCenters(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDistributionCentersUseCase(effectiveOrgId),
  });

  useEffect(() => {
    setSelectedDistributionCenterId("");
  }, [effectiveOrgId]);

  useEffect(() => {
    const list = distributionCentersQuery.data;
    if (!list?.length) return;
    setSelectedDistributionCenterId((prev) =>
      prev && list.some((s) => s.id === prev) ? prev : list[0]!.id,
    );
  }, [distributionCentersQuery.data]);

  const planDetailQuery = useQuery({
    queryKey: queryKeys.planningWindow(planId || "_"),
    enabled: !!planId,
    queryFn: async () => {
      const res = await planningWindowsRepository.getById(planId);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
  });

  const driverShiftSyncKey = JSON.stringify(
    planDetailQuery.data?.driverShifts ?? [],
  );
  useEffect(() => {
    const rows = planDetailQuery.data?.driverShifts;
    if (!rows?.length) return;
    setDriverShiftOrdinalByDriverId((prev) => {
      const next = { ...prev };
      for (const row of rows) next[row.driverId] = String(row.shiftOrdinal);
      return next;
    });
  }, [driverShiftSyncKey]);

  const driversQuery = useQuery({
    queryKey: queryKeys.drivers(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDriversUseCase(effectiveOrgId),
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listVehiclesUseCase(effectiveOrgId),
  });

  const assignmentsQuery = useQuery({
    queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDriverVehicleAssignmentsUseCase(effectiveOrgId),
  });

  const stopsQuery = useQuery({
    queryKey: queryKeys.deliveryStops(effectiveOrgId || "_", planId || "_"),
    enabled: !!effectiveOrgId && !!planId,
    queryFn: () => listDeliveryStopsUseCase(effectiveOrgId, planId),
  });

  const snapshotQuery = useQuery({
    queryKey: [
      ...queryKeys.deliveryStops(effectiveOrgId || "_", planId || "_"),
      ...queryKeys.routes(planId || "_"),
      "workflow-overview",
    ],
    enabled: !!effectiveOrgId && !!planId && step >= 3,
    queryFn: () => loadPlanningMapUseCase(effectiveOrgId, planId),
  });

  const overlay = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return buildMapOverlay(
      snapshotQuery.data.routes,
      snapshotQuery.data.stops,
      polygonAlgorithm,
    );
  }, [snapshotQuery.data, polygonAlgorithm]);

  const refreshPlanningMapSnapshot = useCallback(async () => {
    if (!planId || !effectiveOrgId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.deliveryStops(effectiveOrgId, planId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.routes(planId),
    });
    await snapshotQuery.refetch();
  }, [planId, effectiveOrgId, queryClient, snapshotQuery]);

  useEffect(() => {
    if (!assignmentDriverId && driversQuery.data?.[0]?.id) {
      setAssignmentDriverId(driversQuery.data[0].id);
    }
  }, [assignmentDriverId, driversQuery.data]);

  useEffect(() => {
    if (!assignmentVehicleId && vehiclesQuery.data?.[0]?.id) {
      setAssignmentVehicleId(vehiclesQuery.data[0].id);
    }
  }, [assignmentVehicleId, vehiclesQuery.data]);

  useEffect(() => {
    if (!assignmentFromLocal) {
      setAssignmentFromLocal(toLocalDatetimeInput(new Date().toISOString()));
    }
  }, [assignmentFromLocal]);

  useEffect(() => {
    if (selectedWorkPlanId.trim()) return;
    const first = workPlansQuery.data?.[0]?.id;
    if (first) setSelectedWorkPlanId(first);
  }, [selectedWorkPlanId, workPlansQuery.data]);

  useEffect(() => {
    const ids = assignmentsQuery.data?.map((a) => a.driverId) ?? [];
    setSelectedRouteDriverIds((prev) => prev.filter((id) => ids.includes(id)));
  }, [assignmentsQuery.data]);

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveOrgId || !planDate) {
        throw new Error("Organization and plan date are required.");
      }
      const wp = selectedWorkPlanId.trim();
      const tz = timeZoneId.trim();
      if (!wp) {
        throw new Error("Select a work plan template.");
      }
      if (!tz) {
        throw new Error("Time zone is required for shift-based fleet plans.");
      }
      if (!selectedDistributionCenterId.trim()) {
        throw new Error("Select a distribution center (depot) for route starts.");
      }
      const name = planName.trim() || `Fleet plan ${planDate}`;
      const res = await planningWindowsRepository.add({
        organizationId: effectiveOrgId,
        name,
        workPlanId: wp,
        serviceDate: planDate,
        timeZoneId: tz,
        distributionCenterId: selectedDistributionCenterId,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async (w) => {
      setPlanId(w.id);
      toast.success("Fleet plan created.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindow(w.id),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not create plan."),
  });

  const assignmentAddMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentDriverId || !assignmentVehicleId || !assignmentFromLocal) {
        throw new Error("Driver, vehicle, and effective-from time are required.");
      }
      const body: AddDriverVehicleAssignmentBody = {
        driverId: assignmentDriverId,
        vehicleId: assignmentVehicleId,
        effectiveFromUtc: new Date(assignmentFromLocal).toISOString(),
        effectiveToUtc: null,
      };
      const res = await driverVehicleAssignmentsRepository.add(body);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Driver assigned to vehicle.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not create assignment."),
  });

  const saveDriverShiftsMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      const assignmentDrivers =
        assignmentsQuery.data?.map((a) => a.driverId) ?? [];
      const targetDrivers =
        selectedRouteDriverIds.length > 0
          ? selectedRouteDriverIds.filter((id) =>
              assignmentDrivers.includes(id),
            )
          : assignmentDrivers;
      const assignments = targetDrivers
        .map((driverId) => {
          const ord = driverShiftOrdinalByDriverId[driverId];
          return ord === undefined || ord === ""
            ? null
            : { driverId, shiftOrdinal: Number.parseInt(ord, 10) };
        })
        .filter(
          (x): x is { driverId: string; shiftOrdinal: number } =>
            x !== null && Number.isFinite(x.shiftOrdinal),
        );
      if (
        targetDrivers.length > 0 &&
        assignments.length !== targetDrivers.length
      ) {
        throw new Error(
          "Pick a shift ordinal for every driver included in route generation.",
        );
      }
      const detail = queryClient.getQueryData<PlanningWindowResponseDto>(
        queryKeys.planningWindow(planId),
      );
      if (
        (detail?.dispatchShifts?.length ?? 0) > 0 &&
        assignments.length === 0
      ) {
        throw new Error(
          "This plan uses shift bands — assign at least one driver to a shift.",
        );
      }
      const res = await planningWindowsRepository.setDriverShifts(planId, {
        assignments,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Driver shift assignments saved.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindow(planId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not save shift assignments."),
  });

  useAutoGeocodeFill({
    latitude,
    longitude,
    addressLine1,
    setLatitude,
    setLongitude,
    setAddressLine1,
    enabled: step === 2 && !!planId,
  });

  const resetStopForm = () => {
    setRecipientName("");
    setLatitude("");
    setLongitude("");
    setAddressLine1("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setCountry("");
    setPhone("");
    setTimeSection("");
    setItemSku("");
    setItemDescription("");
    setItemQuantity("1");
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

  const addStopMutation = useMutation({
    mutationFn: async () => {
      const name = recipientName.trim();
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      if (!effectiveOrgId || !planId || !name) {
        throw new Error("Organization, plan, and recipient are required.");
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Enter valid latitude and longitude.");
      }
      if (timeSection && !planDate) {
        throw new Error("Plan date is required when using a time section.");
      }
      const quantity = Number.parseFloat(itemQuantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Item quantity must be greater than zero.");
      }
      const body: AddDeliveryStopBody = {
        organizationId: effectiveOrgId,
        planningWindowId: planId,
        recipientName: name,
        latitude: lat,
        longitude: lng,
        addressLine1: addressLine1.trim() || null,
        city: city.trim() || null,
        region: region.trim() || null,
        postalCode: postalCode.trim() || null,
        country: country.trim() || null,
        phone: phone.trim() || null,
        timeSection: timeSection ? Number(timeSection) : null,
        lineItems: [
          {
            sku: itemSku.trim() || null,
            description: itemDescription.trim() || null,
            quantity,
          },
        ],
      };
      return addDeliveryStopUseCase(body);
    },
    onSuccess: async () => {
      toast.success("Delivery stop added.");
      resetStopForm();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryStops(effectiveOrgId, planId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.routes(planId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not add stop."),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("File", file);
      fd.append("OrganizationId", effectiveOrgId);
      fd.append("PlanningWindowId", planId);
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
        queryKey: queryKeys.deliveryStops(effectiveOrgId, planId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.routes(planId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Import failed."),
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      const detail = queryClient.getQueryData<PlanningWindowResponseDto>(
        queryKeys.planningWindow(planId),
      );
      const dispatchCount = detail?.dispatchShifts?.length ?? 0;
      const driverAssignCount = detail?.driverShifts?.length ?? 0;
      if (dispatchCount > 0 && driverAssignCount === 0) {
        throw new Error(
          "Save driver → shift assignments in step 2 before generating routes.",
        );
      }
      const res = await routePlanningRepository.generateDraftRoutes({
        planningWindowId: planId,
        planningStrategy,
        selectedDriverIds: selectedRouteDriverIds,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async (data) => {
      toast.success(
        `Routes updated: ${data.routesCreated}. ${data.messages?.join(" ") ?? ""}`,
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.routes(planId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryStops(effectiveOrgId, planId),
      });
      await queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.deliveryStops(effectiveOrgId, planId),
          ...queryKeys.routes(planId),
          "workflow-overview",
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindow(planId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not generate routes."),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      const res = await planningWindowsRepository.confirm(planId, {
        strategy: planningStrategy,
        polygonAlgorithm,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Plan confirmed.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindow(planId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not confirm plan."),
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      const res = await planningWindowsRepository.reopen(planId);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Plan re-opened for edits.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindow(planId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not re-open plan."),
  });

  const exportFleetPdfMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      return routePlanningRepository.downloadFleetReportPdf(planId);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-report-${planId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fleet PDF downloaded.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not download fleet PDF."),
  });

  const exportDriversZipMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      return routePlanningRepository.downloadDriverReportsZip(planId);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-reports-${planId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Driver PDFs downloaded.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not download ZIP."),
  });

  const exportJsonMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("No plan selected.");
      const res = await routePlanningRepository.getDriverInstructions(planId);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-instructions-${planId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Instructions exported.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not export JSON."),
  });

  const downloadTemplate = async () => {
    try {
      const blob = await deliveryImportsRepository.downloadExcelTemplate();
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
    if (!effectiveOrgId || !planId) {
      toast.error("Select organization and create a fleet plan first.");
      return;
    }
    importMutation.mutate(file);
  };

  const toggleRouteDriver = (driverId: string, checked: boolean) => {
    setSelectedRouteDriverIds((prev) => {
      if (checked) {
        if (prev.includes(driverId)) return prev;
        return [...prev, driverId];
      }
      return prev.filter((id) => id !== driverId);
    });
  };

  const selectAllRouteDrivers = () => {
    const ids = assignmentsQuery.data?.map((a) => a.driverId) ?? [];
    setSelectedRouteDriverIds(Array.from(new Set(ids)));
  };

  const clearRouteDrivers = () => setSelectedRouteDriverIds([]);

  const goNext = () => {
    if (step === 0) {
      if (!effectiveOrgId || !planId) {
        toast.error(
          "Create a fleet plan first (organization, date, time zone, and work plan template).",
        );
        return;
      }
    }
    setStep((s) => Math.min(s + 1, PLAN_WORKFLOW_STEPS - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const updateDeliveryStopMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateDeliveryStopBody;
    }) => {
      const res = await deliveryStopsRepository.update(id, body);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(tStop("stopSavedToast"));
      await refreshPlanningMapSnapshot();
    },
    onError: (err: Error) =>
      toast.error(err.message || tStop("stopSaveErrorToast")),
  });

  const removeVisitFromRouteMutation = useMutation({
    mutationFn: async (routeStopId: string) => {
      if (!planId) throw new Error(tStop("pickVisit"));
      const res = await planningRouteEditsRepository.removeVisitFromRoute(planId, {
        routeStopId,
      });
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(tStop("removedFromRouteToast"));
      await refreshPlanningMapSnapshot();
    },
    onError: (err: Error) =>
      toast.error(err.message || tStop("removeFromRouteErrorToast")),
  });

  const deleteDeliveryStopMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deliveryStopsRepository.delete(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(tStop("deletedStopToast"));
      await refreshPlanningMapSnapshot();
    },
    onError: (err: Error) =>
      toast.error(err.message || tStop("deleteStopErrorToast")),
  });

  return {
    viewState: {
      step,
      stepsTotal: PLAN_WORKFLOW_STEPS,
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      planDate,
      planName,
      timeZoneId,
      planId,
      planningStrategy,
      planningStrategies: PLANNING_STRATEGIES,
      polygonAlgorithm,
      drivers: driversQuery.data ?? null,
      vehicles: vehiclesQuery.data ?? null,
      assignments: assignmentsQuery.data ?? null,
      stops: stopsQuery.data ?? null,
      stopsLoading: stopsQuery.isLoading,
      snapshot: snapshotQuery.data ?? null,
      mapStops: snapshotQuery.data?.stops ?? null,
      overlay,
      snapshotLoading: snapshotQuery.isLoading,
      lastImport,
      fileInputRef,
      recipientName,
      latitude,
      longitude,
      addressLine1,
      city,
      region,
      postalCode,
      country,
      phone,
      mapPickerOpen,
      pickedPoint,
      timeSection,
      itemSku,
      itemDescription,
      itemQuantity,
      timeSections: TIME_SECTIONS,
      assignmentDriverId,
      assignmentVehicleId,
      assignmentFromLocal,
      selectedRouteDriverIds,
      orgsLoading: orgsQuery.isLoading,
      driversLoading: driversQuery.isLoading,
      vehiclesLoading: vehiclesQuery.isLoading,
      assignmentsLoading: assignmentsQuery.isLoading,
      createPlanPending: createPlanMutation.isPending,
      assignmentPending: assignmentAddMutation.isPending,
      addStopPending: addStopMutation.isPending,
      reverseGeocodePending: reverseFromCoordsMutation.isPending,
      geocodeSearchPending: geocodeSearchMutation.isPending,
      applyPickedPointPending: applyPickedPointMutation.isPending,
      importPending: importMutation.isPending,
      draftPending: draftMutation.isPending,
      confirmPending: confirmMutation.isPending,
      reopenPending: reopenMutation.isPending,
      fleetPdfPending: exportFleetPdfMutation.isPending,
      driversZipPending: exportDriversZipMutation.isPending,
      jsonExportPending: exportJsonMutation.isPending,
      planDetail: planDetailQuery.data ?? null,
      planDetailLoading: planDetailQuery.isLoading,
      workPlans: workPlansQuery.data ?? null,
      workPlansLoading: workPlansQuery.isLoading,
      distributionCenters: distributionCentersQuery.data ?? null,
      distributionCentersLoading: distributionCentersQuery.isLoading,
      selectedDistributionCenterId,
      selectedWorkPlanId,
      driverShiftOrdinalByDriverId,
      saveDriverShiftsPending: saveDriverShiftsMutation.isPending,
      stopEditBusy:
        updateDeliveryStopMutation.isPending ||
        removeVisitFromRouteMutation.isPending ||
        deleteDeliveryStopMutation.isPending,
    },
    actions: {
      setStep,
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setPlanDate,
      setPlanName,
      setTimeZoneId,
      setPlanningStrategy,
      setPolygonAlgorithm,
      setRecipientName,
      setLatitude,
      setLongitude,
      setAddressLine1,
      setCity,
      setRegion,
      setPostalCode,
      setCountry,
      setPhone,
      setMapPickerOpen,
      setPickedPoint,
      setTimeSection,
      setItemSku,
      setItemDescription,
      setItemQuantity,
      setAssignmentDriverId,
      setAssignmentVehicleId,
      setAssignmentFromLocal,
      toggleRouteDriver,
      selectAllRouteDrivers,
      clearRouteDrivers,
      setSelectedWorkPlanId,
      setSelectedDistributionCenterId,
      setDriverShiftOrdinal: (driverId: string, ordinal: string) => {
        setDriverShiftOrdinalByDriverId((prev) => ({
          ...prev,
          [driverId]: ordinal,
        }));
      },
      saveDriverShifts: () => saveDriverShiftsMutation.mutate(),
      createPlan: () => createPlanMutation.mutate(),
      addAssignment: () => assignmentAddMutation.mutate(),
      addStop: () => addStopMutation.mutate(),
      lookupAddressFromCoords: () => reverseFromCoordsMutation.mutate(),
      lookupCoordinatesFromAddress: () => geocodeSearchMutation.mutate(),
      applyPickedPoint: () => applyPickedPointMutation.mutate(),
      downloadTemplate,
      onPickExcel,
      onFileChange,
      generateDraftRoutes: () => draftMutation.mutate(),
      confirmPlan: () => confirmMutation.mutate(),
      reopenPlan: () => reopenMutation.mutate(),
      exportFleetPdf: () => exportFleetPdfMutation.mutate(),
      exportDriversZip: () => exportDriversZipMutation.mutate(),
      exportJson: () => exportJsonMutation.mutate(),
      goNext,
      goBack,
      refreshPlanningMapSnapshot,
      updateDeliveryStop: (id: string, body: UpdateDeliveryStopBody) =>
        updateDeliveryStopMutation.mutateAsync({ id, body }),
      removeVisitFromRoute: (routeStopId: string) =>
        removeVisitFromRouteMutation.mutateAsync(routeStopId),
      deleteDeliveryStop: (id: string) => deleteDeliveryStopMutation.mutateAsync(id),
    },
  };
}

export type PlanWorkflowViewModel = ReturnType<typeof usePlanWorkflowController>;
