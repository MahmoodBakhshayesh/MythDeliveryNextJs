import type { RouteResponseDto } from "@/features/map/domain/planning-map.types";

function draftRoutes(routes: RouteResponseDto[]) {
  return routes.filter((r) => r.status !== 4);
}

/**
 * Fleet vehicles available for proximity split.
 * Ignores draft routes that use vehicles no longer selected in the plan (stale routes).
 */
export function vehiclesAvailableForProximitySplit(
  routeToSplitId: string,
  routes: RouteResponseDto[],
  fleetVehicleIds: string[],
  planVehicleIds: string[],
): string[] {
  const planSet =
    planVehicleIds.length > 0 ? new Set(planVehicleIds) : null;

  const planRoutes = draftRoutes(routes).filter(
    (r) => !planSet || (r.vehicleId && planSet.has(r.vehicleId)),
  );

  const splitRoute = planRoutes.find((r) => r.id === routeToSplitId);
  if (!splitRoute) return [];

  const usedOnOtherRoutes = new Set(
    planRoutes
      .filter((r) => r.id !== routeToSplitId && r.vehicleId)
      .map((r) => r.vehicleId as string),
  );

  const pool = fleetVehicleIds.filter((id) => id && !usedOnOtherRoutes.has(id));

  if (splitRoute.vehicleId && !usedOnOtherRoutes.has(splitRoute.vehicleId)) {
    const v = splitRoute.vehicleId;
    return [v, ...pool.filter((id) => id !== v)];
  }

  return pool;
}

export function maxProximityPartCount(
  stopCount: number,
  availableVehicleIds: string[],
): number {
  if (availableVehicleIds.length < 2 || stopCount < 2) return 0;
  return Math.min(24, stopCount, availableVehicleIds.length);
}

export function vehicleLabelForId(
  vehicleId: string,
  routes: RouteResponseDto[],
  vehicles?: { id: string; name?: string | null }[],
): string {
  const fromRoute = routes.find((r) => r.vehicleId === vehicleId);
  if (fromRoute?.vehicleName?.trim()) return fromRoute.vehicleName.trim();
  const fromFleet = vehicles?.find((v) => v.id === vehicleId);
  if (fromFleet?.name?.trim()) return fromFleet.name.trim();
  return vehicleId.slice(0, 8);
}
