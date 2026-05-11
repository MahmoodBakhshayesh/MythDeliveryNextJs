"use client";

import { useQuery } from "@tanstack/react-query";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listUsersUseCase } from "@/features/users/usecases/list-users.usecase";
import { listManagersUseCase } from "@/features/managers/usecases/list-managers.usecase";
import { listDriversUseCase } from "@/features/drivers/usecases/list-drivers.usecase";
import { listDistributionCentersUseCase } from "@/features/distribution-centers/usecases/list-distribution-centers.usecase";
import { useIsAdmin } from "@/lib/use-is-admin";

export type TeamDirectorySnapshot = {
  orgs: Awaited<ReturnType<typeof listOrganizationsUseCase>>;
  users: Awaited<ReturnType<typeof listUsersUseCase>>;
  managersByOrg: Array<{
    organizationId: string;
    organizationName: string;
    managers: Awaited<ReturnType<typeof listManagersUseCase>>;
  }>;
  driversByOrg: Array<{
    organizationId: string;
    organizationName: string;
    distributionCenters: Awaited<ReturnType<typeof listDistributionCentersUseCase>>;
    drivers: Awaited<ReturnType<typeof listDriversUseCase>>;
  }>;
};

async function loadTeamDirectory(): Promise<TeamDirectorySnapshot> {
  const orgs = await listOrganizationsUseCase();
  const users = await listUsersUseCase();
  const managersByOrg = await Promise.all(
    orgs.map(async (o) => ({
      organizationId: o.id,
      organizationName: o.name,
      managers: await listManagersUseCase(o.id),
    })),
  );
  const driversByOrg = await Promise.all(
    orgs.map(async (o) => ({
      organizationId: o.id,
      organizationName: o.name,
      distributionCenters: await listDistributionCentersUseCase(o.id),
      drivers: await listDriversUseCase(o.id),
    })),
  );
  return { orgs, users, managersByOrg, driversByOrg };
}

export function useTeamDirectoryController() {
  const isAdmin = useIsAdmin();
  const query = useQuery({
    queryKey: ["team-directory"] as const,
    enabled: isAdmin,
    queryFn: loadTeamDirectory,
  });

  return {
    isAdmin,
    loading: query.isLoading,
    error: query.error as Error | null,
    data: query.data ?? null,
    refetch: query.refetch,
  };
}
