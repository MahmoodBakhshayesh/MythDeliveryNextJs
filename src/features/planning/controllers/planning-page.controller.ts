"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { addPlanningWindowUseCase } from "@/features/planning/usecases/add-planning-window.usecase";
import { deletePlanningWindowUseCase } from "@/features/planning/usecases/delete-planning-window.usecase";
import { updatePlanningWindowUseCase } from "@/features/planning/usecases/update-planning-window.usecase";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import { planningWindowsRepository } from "@/features/map/repositories/planning-windows.repository";

function utcIsoToLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeValueToUtcIso(val: string): string {
  return new Date(val).toISOString();
}

export function usePlanningPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanningWindowResponseDto | null>(
    null,
  );
  const [planName, setPlanName] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [timeZoneId, setTimeZoneId] = useState("");
  const [planningStrategy, setPlanningStrategy] = useState<
    "SpatialCell" | "LatitudeBands" | "LongitudeBands" | "RadialFromCentroid"
  >("SpatialCell");
  const [polygonAlgorithm, setPolygonAlgorithm] = useState<
    "convexHull" | "concaveHull" | "boundingBox" | "none"
  >("convexHull");

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

  const windowsQuery = useQuery({
    queryKey: queryKeys.planningWindows(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listPlanningWindowsUseCase(effectiveOrgId),
  });

  const resetForm = () => {
    setEditing(null);
    setPlanName("");
    setStartsAtLocal("");
    setEndsAtLocal("");
    setTimeZoneId("");
  };

  const openCreate = () => {
    resetForm();
    const now = new Date();
    const end = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    setStartsAtLocal(utcIsoToLocalDatetimeValue(now.toISOString()));
    setEndsAtLocal(utcIsoToLocalDatetimeValue(end.toISOString()));
    setDialogOpen(true);
  };

  const openEdit = (w: PlanningWindowResponseDto) => {
    setEditing(w);
    setPlanName(w.name);
    setStartsAtLocal(utcIsoToLocalDatetimeValue(w.startsAtUtc));
    setEndsAtLocal(utcIsoToLocalDatetimeValue(w.endsAtUtc));
    setTimeZoneId(w.timeZoneId ?? "");
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = planName.trim();
      if (!effectiveOrgId || !name || !startsAtLocal || !endsAtLocal) {
        throw new Error("Fill name, start, and end.");
      }
      const startsAtUtc = localDatetimeValueToUtcIso(startsAtLocal);
      const endsAtUtc = localDatetimeValueToUtcIso(endsAtLocal);
      if (new Date(endsAtUtc) <= new Date(startsAtUtc)) {
        throw new Error("End time must be after start time.");
      }
      const tz = timeZoneId.trim() || null;
      if (editing) {
        return updatePlanningWindowUseCase(editing.id, {
          name,
          startsAtUtc,
          endsAtUtc,
          timeZoneId: tz,
        });
      }
      return addPlanningWindowUseCase({
        organizationId: effectiveOrgId,
        name,
        startsAtUtc,
        endsAtUtc,
        timeZoneId: tz,
      });
    },
    onSuccess: async () => {
      toast.success(editing ? "Plan updated." : "Plan created.");
      setDialogOpen(false);
      resetForm();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not save plan."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlanningWindowUseCase(id),
    onSuccess: async () => {
      toast.success("Plan deleted.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete plan."),
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await planningWindowsRepository.confirm(id, {
        strategy: planningStrategy,
        polygonAlgorithm,
      });
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Plan confirmed and locked.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not confirm plan."),
  });

  const reopenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await planningWindowsRepository.reopen(id);
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Plan re-opened.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.planningWindows(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not re-open plan."),
  });

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      planningWindows: windowsQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      windowsLoading: windowsQuery.isLoading,
      dialogOpen,
      editing,
      planName,
      startsAtLocal,
      endsAtLocal,
      timeZoneId,
      planningStrategy,
      polygonAlgorithm,
      savePending: saveMutation.isPending,
      deletePending: deleteMutation.isPending,
      confirmPending: confirmMutation.isPending,
      reopenPending: reopenMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      openCreate,
      openEdit,
      setDialogOpen,
      setPlanName,
      setStartsAtLocal,
      setEndsAtLocal,
      setTimeZoneId,
      setPlanningStrategy,
      setPolygonAlgorithm,
      submit: () => saveMutation.mutate(),
      deletePlan: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Delete this planning window?")
        )
          return;
        deleteMutation.mutate(id);
      },
      confirmPlan: (id: string) => confirmMutation.mutate(id),
      reopenPlan: (id: string) => reopenMutation.mutate(id),
    },
  };
}

export type PlanningPageViewModel = ReturnType<typeof usePlanningPageController>;
