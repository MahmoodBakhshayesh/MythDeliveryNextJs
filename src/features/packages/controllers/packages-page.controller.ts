"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listPackagesUseCase } from "@/features/packages/usecases/list-packages.usecase";
import { queryKeys } from "@/lib/query-keys";

export function usePackagesPageController() {
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

  const packagesQuery = useQuery({
    queryKey: ["packages", effectiveOrgId || "", ""],
    enabled: !!effectiveOrgId,
    queryFn: () => listPackagesUseCase(effectiveOrgId),
  });

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      packages: packagesQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      packagesLoading: packagesQuery.isLoading,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
    },
  };
}

export type PackagesPageViewModel = ReturnType<typeof usePackagesPageController>;
