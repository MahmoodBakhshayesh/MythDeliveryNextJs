"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { geocodingRepository } from "@/features/geocoding/repositories/geocoding.repository";
import { buildMapOverlay } from "@/features/map/lib/build-map-overlay";
import { addDeliveryStopUseCase } from "@/features/map/usecases/add-delivery-stop.usecase";
import { loadPlanningMapUseCase } from "@/features/map/usecases/load-planning-map.usecase";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listVehiclesUseCase } from "@/features/fleet/usecases/list-vehicles.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";
import {
  POLYGON_REGION_STORAGE_KEY,
  type PolygonRegionAlgorithm,
  type UpdateDeliveryStopBody,
} from "@/features/map/domain/planning-map.types";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { planningRouteEditsRepository } from "@/features/map/repositories/planning-route-edits.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

function readStoredPolygonAlgorithm(): PolygonRegionAlgorithm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POLYGON_REGION_STORAGE_KEY);
    if (
      raw === "convexHull" ||
      raw === "concaveHull" ||
      raw === "boundingBox" ||
      raw === "partitionNoOverlap" ||
      raw === "none"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function usePlanningMapController() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tStop = useTranslations("UiRouteEdit");
  const [polygonRegionAlgorithm, setPolygonRegionAlgorithm] =
    useState<PolygonRegionAlgorithm>("convexHull");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPlanningWindowId, setSelectedPlanningWindowId] =
    useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingLat, setPendingLat] = useState<number | null>(null);
  const [pendingLng, setPendingLng] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState("New stop");
  const [addressLine1, setAddressLine1] = useState("");

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles(selectedOrgId || "_"),
    enabled: !!selectedOrgId,
    queryFn: () => listVehiclesUseCase(selectedOrgId),
  });

  const fleetVehicleIds = useMemo(
    () => vehiclesQuery.data?.filter((v) => v.isActive).map((v) => v.id) ?? [],
    [vehiclesQuery.data],
  );

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    const stored = readStoredPolygonAlgorithm();
    if (stored) setPolygonRegionAlgorithm(stored);
  }, []);

  useEffect(() => {
    const orgId = searchParams.get("organizationId");
    const planningWindowId = searchParams.get("planningWindowId");
    if (orgId) setSelectedOrgId(orgId);
    if (planningWindowId) setSelectedPlanningWindowId(planningWindowId);
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(POLYGON_REGION_STORAGE_KEY, polygonRegionAlgorithm);
    } catch {
      /* ignore */
    }
  }, [polygonRegionAlgorithm]);

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
  const selectedPlanningWindow = planningWindows?.find(
    (w) => w.id === selectedPlanningWindowId,
  );
  const firstPwId = planningWindows?.[0]?.id;

  useEffect(() => {
    if (!planningWindows?.length) {
      setSelectedPlanningWindowId("");
      return;
    }
    const stillValid = planningWindows.some(
      (w) => w.id === selectedPlanningWindowId,
    );
    if (!selectedPlanningWindowId || !stillValid) {
      setSelectedPlanningWindowId(firstPwId ?? "");
    }
  }, [planningWindows, firstPwId, selectedPlanningWindowId]);

  const snapshotQuery = useQuery({
    queryKey: [
      ...queryKeys.deliveryStops(effectiveOrgId, selectedPlanningWindowId),
      ...queryKeys.routes(selectedPlanningWindowId || "_"),
    ],
    enabled: !!effectiveOrgId && !!selectedPlanningWindowId,
    queryFn: () =>
      loadPlanningMapUseCase(effectiveOrgId, selectedPlanningWindowId),
  });

  const overlay = useMemo(() => {
    const data = snapshotQuery.data;
    if (!data) return null;
    return buildMapOverlay(
      data.routes,
      data.stops,
      polygonRegionAlgorithm,
    );
  }, [snapshotQuery.data, polygonRegionAlgorithm]);

  const refreshMapSnapshot = useCallback(async () => {
    if (!effectiveOrgId || !selectedPlanningWindowId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.deliveryStops(effectiveOrgId, selectedPlanningWindowId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.routes(selectedPlanningWindowId),
    });
    await snapshotQuery.refetch();
  }, [
    effectiveOrgId,
    selectedPlanningWindowId,
    queryClient,
    snapshotQuery,
  ]);

  const geoAutoSeq = useRef(0);
  const pendingLatRef = useRef(pendingLat);
  const pendingLngRef = useRef(pendingLng);
  const mapAddrRef = useRef(addressLine1);
  pendingLatRef.current = pendingLat;
  pendingLngRef.current = pendingLng;
  mapAddrRef.current = addressLine1;

  useEffect(() => {
    if (!addDialogOpen) return;
    const plat = pendingLatRef.current;
    const plng = pendingLngRef.current;
    if (plat === null || plng === null) return;

    const id = ++geoAutoSeq.current;
    const timer = window.setTimeout(async () => {
      if (geoAutoSeq.current !== id) return;
      if (mapAddrRef.current.trim().length > 0) return;
      const pLat = pendingLatRef.current;
      const pLng = pendingLngRef.current;
      if (pLat === null || pLng === null) return;
      try {
        const res = await geocodingRepository.reverse(pLat, pLng);
        if (geoAutoSeq.current !== id) return;
        if (!isAppSuccess(res) || !res.body?.displayAddress?.trim()) return;
        if (mapAddrRef.current.trim().length > 0) return;
        setAddressLine1(res.body.displayAddress.trim());
      } catch {
        /* silent */
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [addDialogOpen, pendingLat, pendingLng, addressLine1]);

  const reverseGeocodeMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const res = await geocodingRepository.reverse(lat, lng);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body.displayAddress?.trim() ?? "";
    },
    onSuccess: (addr) => {
      if (addr) setAddressLine1(addr);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not look up address."),
  });

  const geocodeSearchMutation = useMutation({
    mutationFn: async () => {
      const q = addressLine1.trim();
      if (!q) throw new Error("Enter an address or place name.");
      const biasLat = pendingLat;
      const biasLng = pendingLng;
      const bias =
        biasLat !== null &&
        biasLng !== null &&
        Number.isFinite(biasLat) &&
        Number.isFinite(biasLng)
          ? { lat: biasLat, lng: biasLng }
          : undefined;
      const res = await geocodingRepository.search(q, bias);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      const first = res.body.results?.[0];
      if (!first)
        throw new Error("No matching places.");
      return first;
    },
    onSuccess: (first) => {
      setPendingLat(first.latitude);
      setPendingLng(first.longitude);
      toast.success("Coordinates updated from Map.ir search.");
      reverseGeocodeMutation.mutate({
        lat: first.latitude,
        lng: first.longitude,
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not search address."),
  });

  const addMutation = useMutation({
    mutationFn: addDeliveryStopUseCase,
    onSuccess: async () => {
      toast.success("Delivery stop added.");
      setAddDialogOpen(false);
      setPendingLat(null);
      setPendingLng(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryStops(
          effectiveOrgId,
          selectedPlanningWindowId,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.routes(selectedPlanningWindowId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not add stop.");
    },
  });

  const openAddDialogAt = (lat: number, lng: number) => {
    if (selectedPlanningWindow?.isConfirmed) {
      toast.error("Plan is confirmed and locked. Re-open it to edit stops.");
      return;
    }
    setPendingLat(lat);
    setPendingLng(lng);
    setRecipientName("New stop");
    setAddressLine1("");
    setAddDialogOpen(true);
  };

  const submitAddStop = () => {
    if (
      pendingLat === null ||
      pendingLng === null ||
      !effectiveOrgId ||
      !selectedPlanningWindowId
    ) {
      return;
    }
    const name = recipientName.trim() || "New stop";
    addMutation.mutate({
      organizationId: effectiveOrgId,
      planningWindowId: selectedPlanningWindowId,
      recipientName: name,
      latitude: pendingLat,
      longitude: pendingLng,
      addressLine1: addressLine1.trim() || null,
      lineItems: [{ quantity: 1 }],
    });
  };

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
      await refreshMapSnapshot();
    },
    onError: (err: Error) =>
      toast.error(err.message || tStop("stopSaveErrorToast")),
  });

  const removeVisitFromRouteMutation = useMutation({
    mutationFn: async (routeStopId: string) => {
      if (!selectedPlanningWindowId) throw new Error(tStop("pickVisit"));
      const res = await planningRouteEditsRepository.removeVisitFromRoute(
        selectedPlanningWindowId,
        { routeStopId },
      );
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(tStop("removedFromRouteToast"));
      await refreshMapSnapshot();
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
      await refreshMapSnapshot();
    },
    onError: (err: Error) =>
      toast.error(err.message || tStop("deleteStopErrorToast")),
  });

  return {
    viewState: {
      organizations: orgs ?? null,
      planningWindows: planningWindows ?? null,
      selectedPlanningWindow: selectedPlanningWindow ?? null,
      selectedOrgId: effectiveOrgId,
      selectedPlanningWindowId,
      overlay,
      snapshotLoading: snapshotQuery.isLoading,
      snapshotError: snapshotQuery.error as Error | null,
      orgsLoading: orgsQuery.isLoading,
      planningWindowsLoading: planningWindowsQuery.isLoading,
      polygonRegionAlgorithm,
      addDialogOpen,
      pendingLat,
      pendingLng,
      recipientName,
      addressLine1,
      addPending: addMutation.isPending,
      reverseGeocodePending: reverseGeocodeMutation.isPending,
      geocodeSearchPending: geocodeSearchMutation.isPending,
      mapRoutes: snapshotQuery.data?.routes ?? null,
      mapStops: snapshotQuery.data?.stops ?? null,
      fleetVehicleIds,
      fleetVehicles: vehiclesQuery.data ?? null,
      stopEditBusy:
        updateDeliveryStopMutation.isPending ||
        removeVisitFromRouteMutation.isPending ||
        deleteDeliveryStopMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setPlanningWindowId: (id: string | null) =>
        setSelectedPlanningWindowId(id ?? ""),
      setPolygonRegionAlgorithm,
      openAddDialogAt,
      setAddDialogOpen,
      setRecipientName,
      setAddressLine1,
      submitAddStop,
      lookupCoordinatesFromAddress: () => geocodeSearchMutation.mutate(),
      refreshMapSnapshot,
      updateDeliveryStop: (id: string, body: UpdateDeliveryStopBody) =>
        updateDeliveryStopMutation.mutateAsync({ id, body }),
      removeVisitFromRoute: (routeStopId: string) =>
        removeVisitFromRouteMutation.mutateAsync(routeStopId),
      deleteDeliveryStop: (id: string) =>
        deleteDeliveryStopMutation.mutateAsync(id),
    },
  };
}

export type PlanningMapViewModel = ReturnType<typeof usePlanningMapController>;
