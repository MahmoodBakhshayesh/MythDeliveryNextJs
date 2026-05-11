"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listMyHandledPackagesForWindowUseCase,
  listMyPlanningWindowsUseCase,
  listMyRoutesUseCase,
} from "@/features/driver-portal/usecases/driver-portal-history.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useDriverPortalHistoryController() {
  const [expandedPlanningWindowId, setExpandedPlanningWindowId] = useState<
    string | null
  >(null);

  const windowsQuery = useQuery({
    queryKey: queryKeys.driverPortalPlanningWindows,
    queryFn: () => listMyPlanningWindowsUseCase(),
  });

  const routesQuery = useQuery({
    queryKey: queryKeys.driverPortalRoutes(expandedPlanningWindowId ?? "_"),
    queryFn: () => listMyRoutesUseCase(expandedPlanningWindowId ?? ""),
    enabled: !!expandedPlanningWindowId,
  });

  const packagesQuery = useQuery({
    queryKey: queryKeys.driverPortalHandledPackages(
      expandedPlanningWindowId ?? "_",
    ),
    queryFn: () =>
      listMyHandledPackagesForWindowUseCase(expandedPlanningWindowId ?? ""),
    enabled: !!expandedPlanningWindowId,
  });

  const detailLoading =
    !!expandedPlanningWindowId &&
    (routesQuery.isLoading || packagesQuery.isLoading);

  const togglePlan = (id: string) => {
    setExpandedPlanningWindowId((cur) => (cur === id ? null : id));
  };

  const sortedWindows = useMemo(() => {
    const list = windowsQuery.data ?? [];
    return [...list].sort((a, b) =>
      b.startsAtUtc.localeCompare(a.startsAtUtc),
    );
  }, [windowsQuery.data]);

  return {
    viewState: {
      windows: sortedWindows,
      windowsLoading: windowsQuery.isLoading,
      windowsError: windowsQuery.error,
      expandedPlanningWindowId,
      routes: routesQuery.data ?? null,
      packages: packagesQuery.data ?? null,
      detailLoading,
      detailError: routesQuery.error ?? packagesQuery.error,
    },
    actions: {
      togglePlan,
    },
  };
}

export type DriverPortalHistoryViewModel = ReturnType<
  typeof useDriverPortalHistoryController
>;
