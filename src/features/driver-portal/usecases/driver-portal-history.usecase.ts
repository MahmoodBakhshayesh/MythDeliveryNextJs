import { driverPortalRepository } from "@/features/driver-portal/repositories/driver-portal.repository";
import type { DriverPortalRouteDto } from "@/features/driver-portal/domain/driver-portal.types";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";
import type { DeliveryPackageResponse } from "@/features/packages/domain/package.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listMyPlanningWindowsUseCase(): Promise<
  PlanningWindowResponseDto[]
> {
  const res = await driverPortalRepository.listMyPlanningWindows();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}

export async function listMyRoutesUseCase(
  planningWindowId?: string,
): Promise<DriverPortalRouteDto[]> {
  const res = await driverPortalRepository.listMyRoutes(planningWindowId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}

export async function listMyRoutesForWindowUseCase(
  planningWindowId: string,
): Promise<DriverPortalRouteDto[]> {
  return listMyRoutesUseCase(planningWindowId);
}

export async function listMyHandledPackagesForWindowUseCase(
  planningWindowId: string,
): Promise<DeliveryPackageResponse[]> {
  const res = await driverPortalRepository.listMyHandledPackages(planningWindowId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}

export async function listAllMyHandledPackagesUseCase(): Promise<
  DeliveryPackageResponse[]
> {
  const res = await driverPortalRepository.listMyHandledPackages();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
