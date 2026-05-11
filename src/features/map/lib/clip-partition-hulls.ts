import difference from "@turf/difference";
import union from "@turf/union";
import { featureCollection, polygon } from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon, Position } from "geojson";
import type { RouteLayerModel } from "@/features/map/domain/planning-map.types";

function ringLatLngToPolygonFeature(
  ring: [number, number][],
): Feature<Polygon> | null {
  if (ring.length < 3) return null;
  const closed =
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring
      : [...ring, ring[0]];
  const coords = closed.map(([lat, lng]) => [lng, lat] as [number, number]);
  return polygon([coords]);
}

function ringLngLatToLeaflet(ring: Position[]): [number, number][] {
  return ring.map((p) => {
    const lng = p[0];
    const lat = p[1];
    return [lat, lng] as [number, number];
  });
}

function polygonAreaRing(ring: Position[]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

function featureToLeafletRing(
  f: Feature<Polygon | MultiPolygon> | null,
): [number, number][] | null {
  if (!f?.geometry) return null;
  const g = f.geometry;
  if (g.type === "Polygon") {
    const outer = g.coordinates[0];
    if (!outer?.length) return null;
    return ringLngLatToLeaflet(outer);
  }
  if (g.type === "MultiPolygon" && g.coordinates.length) {
    let best: Position[] | null = null;
    let bestA = -1;
    for (const poly of g.coordinates) {
      const outer = poly[0];
      if (!outer?.length) continue;
      const a = polygonAreaRing(outer);
      if (a > bestA) {
        bestA = a;
        best = outer;
      }
    }
    return best ? ringLngLatToLeaflet(best) : null;
  }
  return null;
}

/**
 * Trims each route hull by subtracting hulls of routes that appear earlier in a stable sort,
 * so shaded regions do not stack on top of each other (order: route id).
 */
export function applyNonOverlappingHullClip(
  layers: RouteLayerModel[],
): RouteLayerModel[] {
  const sorted = [...layers].sort((a, b) => a.routeId.localeCompare(b.routeId));
  const hullByRouteId = new Map<string, [number, number][] | null>();
  let acc: Feature<Polygon | MultiPolygon> | null = null;

  for (const layer of sorted) {
    if (!layer.hull || layer.hull.length < 3) {
      hullByRouteId.set(layer.routeId, layer.hull);
      continue;
    }
    const raw = ringLatLngToPolygonFeature(layer.hull);
    if (!raw) {
      hullByRouteId.set(layer.routeId, layer.hull);
      continue;
    }
    if (!acc) {
      acc = raw;
      hullByRouteId.set(layer.routeId, layer.hull);
      continue;
    }
    const diffed = difference(featureCollection([raw, acc]));
    hullByRouteId.set(layer.routeId, featureToLeafletRing(diffed));
    const merged: Feature<Polygon | MultiPolygon> | null = union(
      featureCollection([acc, raw]),
    ) as Feature<Polygon | MultiPolygon> | null;
    if (merged) acc = merged;
  }

  return layers.map((l) => ({
    ...l,
    hull: hullByRouteId.has(l.routeId)
      ? (hullByRouteId.get(l.routeId) ?? l.hull)
      : l.hull,
  }));
}
