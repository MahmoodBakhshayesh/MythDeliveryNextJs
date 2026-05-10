"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import {
  workPlansRepository,
  type WorkPlanShiftRequest,
} from "@/features/work-plans/repositories/work-plans.repository";
import type { WorkPlanResponseDto } from "@/features/work-plans/domain/work-plan.types";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export type ShiftDraftRow = {
  ordinal: number;
  localStart: string;
  localEnd: string;
};

function normalizeTime(value: string): string {
  const v = value.trim();
  if (!v) return "08:00:00";
  return v.length === 5 ? `${v}:00` : v;
}

export function useWorkPlansPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [shiftRows, setShiftRows] = useState<ShiftDraftRow[]>([
    { ordinal: 0, localStart: "08:00", localEnd: "16:00" },
  ]);

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

  const plansQuery = useQuery({
    queryKey: queryKeys.workPlans(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: async () => {
      const res = await workPlansRepository.list(effectiveOrgId);
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveOrgId) throw new Error("Organization required.");
      const name = newPlanName.trim();
      if (!name) throw new Error("Name required.");
      if (!shiftRows.length) throw new Error("Add at least one shift.");
      const shifts: WorkPlanShiftRequest[] = shiftRows.map((r, i) => ({
        ordinal: typeof r.ordinal === "number" ? r.ordinal : i,
        localStart: normalizeTime(r.localStart),
        localEnd: normalizeTime(r.localEnd),
      }));
      const res = await workPlansRepository.add({
        organizationId: effectiveOrgId,
        name,
        shifts,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Work plan created.");
      setNewPlanName("");
      setShiftRows([{ ordinal: 0, localStart: "08:00", localEnd: "16:00" }]);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workPlans(effectiveOrgId),
      });
    },
    onError: (e: Error) => toast.error(e.message || "Create failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await workPlansRepository.delete(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success("Deleted.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workPlans(effectiveOrgId),
      });
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed."),
  });

  const addShiftRow = () => {
    setShiftRows((rows) => {
      const nextOrd =
        rows.length === 0
          ? 0
          : Math.max(...rows.map((r) => r.ordinal)) + 1;
      return [...rows, { ordinal: nextOrd, localStart: "16:00", localEnd: "23:59" }];
    });
  };

  const removeShiftRow = (ordinal: number) => {
    setShiftRows((rows) => rows.filter((r) => r.ordinal !== ordinal));
  };

  const updateShiftRow = (
    ordinal: number,
    patch: Partial<Pick<ShiftDraftRow, "localStart" | "localEnd">>,
  ) => {
    setShiftRows((rows) =>
      rows.map((r) => (r.ordinal === ordinal ? { ...r, ...patch } : r)),
    );
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      plans: plansQuery.data ?? ([] as WorkPlanResponseDto[]),
      orgsLoading: orgsQuery.isLoading,
      plansLoading: plansQuery.isLoading,
      newPlanName,
      shiftRows,
      createPending: createMutation.isPending,
      deletePendingId: deleteMutation.isPending ? deleteMutation.variables : null,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setNewPlanName,
      addShiftRow,
      removeShiftRow,
      updateShiftRow,
      createPlan: () => createMutation.mutate(),
      deletePlan: (id: string) => deleteMutation.mutate(id),
    },
  };
}

export type WorkPlansPageViewModel = ReturnType<
  typeof useWorkPlansPageController
>;
