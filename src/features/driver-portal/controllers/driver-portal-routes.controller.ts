"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listMyPlanningWindowsUseCase,
  listMyRoutesUseCase,
} from "@/features/driver-portal/usecases/driver-portal-history.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useDriverPortalRoutesController() {
  const [planningWindowFilter, setPlanningWindowFilter] = useState("");

  const windowsQuery = useQuery({
    queryKey: queryKeys.driverPortalPlanningWindows,
    queryFn: () => listMyPlanningWindowsUseCase(),
  });

  const routesQuery = useQuery({
    queryKey: queryKeys.driverPortalRoutesAll(planningWindowFilter || "_"),
    queryFn: () =>
      listMyRoutesUseCase(
        planningWindowFilter.length > 0 ? planningWindowFilter : undefined,
      ),
  });

  return {
    viewState: {
      windows: windowsQuery.data ?? null,
      windowsLoading: windowsQuery.isLoading,
      planningWindowFilter,
      routes: routesQuery.data ?? null,
      routesLoading: routesQuery.isLoading,
      routesError: routesQuery.error,
    },
    actions: {
      setPlanningWindowFilter,
    },
  };
}

export type DriverPortalRoutesViewModel = ReturnType<
  typeof useDriverPortalRoutesController
>;
