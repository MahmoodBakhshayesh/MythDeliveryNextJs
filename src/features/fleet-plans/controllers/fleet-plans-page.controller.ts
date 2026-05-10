"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listPlanningWindowsUseCase } from "@/features/map/usecases/list-planning-windows.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { routePlanningRepository } from "@/features/planning/repositories/route-planning.repository";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export function useFleetPlansPageController() {
  const [selectedOrgId, setSelectedOrgId] = useState("");

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

  const sortedWindows = useMemo(() => {
    const list = windowsQuery.data ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.startsAtUtc).getTime() - new Date(a.startsAtUtc).getTime(),
    );
  }, [windowsQuery.data]);

  const fleetPdfMutation = useMutation({
    mutationFn: (planningWindowId: string) =>
      routePlanningRepository.downloadFleetReportPdf(planningWindowId),
    onSuccess: (blob, planningWindowId) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-report-${planningWindowId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fleet PDF downloaded.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not download fleet PDF."),
  });

  const driversZipMutation = useMutation({
    mutationFn: (planningWindowId: string) =>
      routePlanningRepository.downloadDriverReportsZip(planningWindowId),
    onSuccess: (blob, planningWindowId) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-reports-${planningWindowId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Driver PDFs downloaded.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not download ZIP."),
  });

  const exportJsonMutation = useMutation({
    mutationFn: async (planningWindowId: string) => {
      const res =
        await routePlanningRepository.getDriverInstructions(planningWindowId);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return { planningWindowId, data: res.body };
    },
    onSuccess: ({ planningWindowId, data }) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-instructions-${planningWindowId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Instructions exported.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not export JSON."),
  });

  const busyPlanId =
    fleetPdfMutation.isPending && fleetPdfMutation.variables
      ? fleetPdfMutation.variables
      : driversZipMutation.isPending && driversZipMutation.variables
        ? driversZipMutation.variables
        : exportJsonMutation.isPending && exportJsonMutation.variables
          ? exportJsonMutation.variables
          : null;

  const busyKind = fleetPdfMutation.isPending
    ? ("fleet" as const)
    : driversZipMutation.isPending
      ? ("zip" as const)
      : exportJsonMutation.isPending
        ? ("json" as const)
        : null;

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      planningWindows: sortedWindows,
      orgsLoading: orgsQuery.isLoading,
      windowsLoading: windowsQuery.isLoading,
      busyPlanId,
      busyKind,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      downloadFleetPdf: (planningWindowId: string) =>
        fleetPdfMutation.mutate(planningWindowId),
      downloadDriversZip: (planningWindowId: string) =>
        driversZipMutation.mutate(planningWindowId),
      exportJson: (planningWindowId: string) =>
        exportJsonMutation.mutate(planningWindowId),
    },
  };
}

export type FleetPlansPageViewModel = ReturnType<
  typeof useFleetPlansPageController
>;
