import type {
  DeliveryStopResponseDto,
  MapOverlayModel,
  PolygonRegionAlgorithm,
  RouteLayerModel,
  RouteResponseDto,
  StopPinModel,
} from "@/features/map/domain/planning-map.types";
import { colorForDriverId } from "@/features/map/lib/driver-color";
import { computeRouteRegionRing } from "@/features/map/lib/polygon-region";

const UNASSIGNED_STOP_COLOR = "hsl(220 12% 52%)";

export function buildMapOverlay(
  routes: RouteResponseDto[],
  stops: DeliveryStopResponseDto[],
  polygonAlgorithm: PolygonRegionAlgorithm,
): MapOverlayModel {
  const stopColorById = new Map<string, string>();
  const stopSequenceById = new Map<string, number>();

  const routeLayers: RouteLayerModel[] = routes.map((route) => {
    const color = colorForDriverId(route.driverId);
    const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    for (const rs of sorted) {
      stopColorById.set(rs.deliveryStopId, color);
      stopSequenceById.set(rs.deliveryStopId, rs.sequence);
    }
    const polyline: [number, number][] = sorted.map((s) => [
      s.latitude,
      s.longitude,
    ]);
    const hull = computeRouteRegionRing(sorted, polygonAlgorithm);

    return {
      routeId: route.id,
      driverId: route.driverId,
      driverName: route.driverName?.trim() || "Driver",
      color,
      polyline,
      hull,
    };
  });

  const pins: StopPinModel[] = stops.map((s) => ({
    id: s.id,
    recipientName: s.recipientName,
    lat: s.latitude,
    lng: s.longitude,
    color: stopColorById.get(s.id) ?? UNASSIGNED_STOP_COLOR,
    sequence: stopSequenceById.get(s.id) ?? null,
  }));

  const boundsPoints: [number, number][] = stops.map((s) => [
    s.latitude,
    s.longitude,
  ]);

  return { routes: routeLayers, stops: pins, boundsPoints };
}
