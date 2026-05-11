"use client";

import { useQuery } from "@tanstack/react-query";
import { listAllMyHandledPackagesUseCase } from "@/features/driver-portal/usecases/driver-portal-history.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useDriverPortalPackagesController() {
  const packagesQuery = useQuery({
    queryKey: queryKeys.driverPortalAllHandledPackages,
    queryFn: () => listAllMyHandledPackagesUseCase(),
  });

  return {
    viewState: {
      packages: packagesQuery.data ?? null,
      loading: packagesQuery.isLoading,
      error: packagesQuery.error,
    },
    actions: {},
  };
}

export type DriverPortalPackagesViewModel = ReturnType<
  typeof useDriverPortalPackagesController
>;
