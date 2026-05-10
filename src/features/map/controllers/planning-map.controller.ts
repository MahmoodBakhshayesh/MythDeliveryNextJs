"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildMapOverlay } from "@/features/map/lib/build-map-overlay";
import { addDeliveryStopUseCase } from "@/features/map/usecases/add-delivery-stop.usecase";
import { loadPlanningMapUseCase } from "@/features/map/usecases/load-planning-map.usecase";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";
import {
  POLYGON_REGION_STORAGE_KEY,
  type PolygonRegionAlgorithm,
} from "@/features/map/domain/planning-map.types";

function readStoredPolygonAlgorithm(): PolygonRegionAlgorithm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POLYGON_REGION_STORAGE_KEY);
    if (
      raw === "convexHull" ||
      raw === "concaveHull" ||
      raw === "boundingBox" ||
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
  const [polygonRegionAlgorithm, setPolygonRegionAlgorithm] =
    useState<PolygonRegionAlgorithm>("convexHull");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPlanningWindowId, setSelectedPlanningWindowId] =
    useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingLat, setPendingLat] = useState<number | null>(null);
  const [pendingLng, setPendingLng] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState("New stop");

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    const stored = readStoredPolygonAlgorithm();
    if (stored) setPolygonRegionAlgorithm(stored);
  }, []);

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
    setPendingLat(lat);
    setPendingLng(lng);
    setRecipientName("New stop");
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
      serviceMinutes: 10,
    });
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      planningWindows: planningWindows ?? null,
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
      addPending: addMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setPlanningWindowId: (id: string | null) =>
        setSelectedPlanningWindowId(id ?? ""),
      setPolygonRegionAlgorithm,
      openAddDialogAt,
      setAddDialogOpen,
      setRecipientName,
      submitAddStop,
    },
  };
}

export type PlanningMapViewModel = ReturnType<typeof usePlanningMapController>;
