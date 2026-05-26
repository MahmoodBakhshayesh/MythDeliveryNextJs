import type {
  DeliveryStopResponseDto,
  MapOverlayModel,
  RouteResponseDto,
} from "@/features/map/domain/planning-map.types";
import {
  estimateDrivePlusServiceMinutes,
  polylineLengthKm,
  ringAreaKm2,
} from "@/features/map/lib/route-metrics";

export type RouteAssignmentSummary = {
  routeId: string;
  label: string;
  vehicleName: string | null;
  routeName: string | null;
  color: string;
  stopCount: number;
  pathKm: number;
  estMinutes: number;
  regionKm2: number | null;
  totalWeightKg: number;
  totalVolumeM3: number;
};

function sumStopLoad(
  stopIds: Set<string>,
  stops: DeliveryStopResponseDto[],
): { weightKg: number; volumeM3: number } {
  let weightKg = 0;
  let volumeM3 = 0;
  for (const s of stops) {
    if (!stopIds.has(s.id)) continue;
    weightKg += Number(s.weightKg ?? 0);
    volumeM3 += Number(s.volumeM3 ?? 0);
  }
  return { weightKg, volumeM3 };
}

export function buildRouteAssignmentSummaries(
  routes: RouteResponseDto[],
  overlay: MapOverlayModel | null | undefined,
  mapStops: DeliveryStopResponseDto[] | null | undefined,
): RouteAssignmentSummary[] {
  const layerByRouteId = new Map(
    (overlay?.routes ?? []).map((l) => [l.routeId, l]),
  );

  return routes.map((route) => {
    const layer = layerByRouteId.get(route.id);
    const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    const stopCount = sortedStops.length;
    const polyline: [number, number][] =
      layer?.polyline ??
      sortedStops.map((s) => [s.latitude, s.longitude] as [number, number]);
    const pathKm = polylineLengthKm(polyline);
    const estMinutes =
      stopCount > 0 ? estimateDrivePlusServiceMinutes(pathKm, stopCount) : 0;
    const regionKm2 = layer?.hull ? ringAreaKm2(layer.hull) : null;
    const stopIds = new Set(sortedStops.map((s) => s.deliveryStopId));
    const { weightKg, volumeM3 } = sumStopLoad(stopIds, mapStops ?? []);

    const vehicleName = route.vehicleName?.trim() || null;
    const routeName = route.name?.trim() || null;
    const label = vehicleName ?? routeName ?? `Route ${route.id.slice(0, 8)}`;

    return {
      routeId: route.id,
      label,
      vehicleName,
      routeName,
      color: layer?.color ?? "hsl(220 12% 52%)",
      stopCount,
      pathKm,
      estMinutes,
      regionKm2,
      totalWeightKg: weightKg,
      totalVolumeM3: volumeM3,
    };
  });
}
