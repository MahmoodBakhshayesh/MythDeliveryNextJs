import type {
  DeliveryStopResponseDto,
  MapOverlayModel,
  PolygonRegionAlgorithm,
  RouteLayerModel,
  RouteResponseDto,
  StopPinModel,
} from "@/features/map/domain/planning-map.types";
import { applyNonOverlappingHullClip } from "@/features/map/lib/clip-partition-hulls";
import { colorForMapRoute } from "@/features/map/lib/driver-color";
import { computeRouteRegionRing } from "@/features/map/lib/polygon-region";

const UNASSIGNED_STOP_COLOR = "hsl(220 12% 52%)";

export function buildMapOverlay(
  routes: RouteResponseDto[],
  stops: DeliveryStopResponseDto[],
  polygonAlgorithm: PolygonRegionAlgorithm,
): MapOverlayModel {
  const stopColorById = new Map<string, string>();
  const stopSequenceById = new Map<string, number>();

  const routeCount = routes.length;
  const routeLayersBuilt: RouteLayerModel[] = routes.map((route, index) => {
    const color = colorForMapRoute(route.id, index, routeCount);
    const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    for (const rs of sorted) {
      stopColorById.set(rs.deliveryStopId, color);
      stopSequenceById.set(rs.deliveryStopId, rs.sequence);
    }
    const polyline: [number, number][] = sorted.map((s) => [
      s.latitude,
      s.longitude,
    ]);
    const hullRingAlgorithm =
      polygonAlgorithm === "partitionNoOverlap" ? "convexHull" : polygonAlgorithm;
    const hull = computeRouteRegionRing(sorted, hullRingAlgorithm);

    return {
      routeId: route.id,
      driverId: route.driverId,
      driverName:
        route.driverName?.trim() ||
        route.vehicleName?.trim() ||
        "Route",
      color,
      polyline,
      hull,
    };
  });

  const routeStopMetaByDeliveryId = new Map<
    string,
    { routeStopId: string; routeId: string }
  >();
  for (const route of routes) {
    for (const rs of route.stops) {
      routeStopMetaByDeliveryId.set(rs.deliveryStopId, {
        routeStopId: rs.id,
        routeId: route.id,
      });
    }
  }

  const routeLayers =
    polygonAlgorithm === "partitionNoOverlap"
      ? applyNonOverlappingHullClip(routeLayersBuilt)
      : routeLayersBuilt;

  const pins: StopPinModel[] = stops.map((s) => {
    const meta = routeStopMetaByDeliveryId.get(s.id);
    return {
      id: s.id,
      recipientName: s.recipientName,
      lat: s.latitude,
      lng: s.longitude,
      color: stopColorById.get(s.id) ?? UNASSIGNED_STOP_COLOR,
      sequence: stopSequenceById.get(s.id) ?? null,
      routeStopId: meta?.routeStopId ?? null,
      routeId: meta?.routeId ?? null,
    };
  });

  const boundsPoints: [number, number][] = stops.map((s) => [
    s.latitude,
    s.longitude,
  ]);

  return { routes: routeLayers, stops: pins, boundsPoints };
}
