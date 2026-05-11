import area from "@turf/area";
import type { Feature, Polygon } from "geojson";

const EARTH_RADIUS_KM = 6371;

/** Haversine distance between two [lat, lng] points in kilometers. */
export function haversineKm(
  a: [number, number],
  b: [number, number],
): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const la1 = toRad(lat1);
  const la2 = toRad(lat2);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Sum of great-circle segments along a [lat, lng] polyline (visit order). */
export function polylineLengthKm(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1]!, points[i]!);
  }
  return sum;
}

/**
 * Planar geodesic polygon area in km² (Turf on WGS84 ring).
 * Ring is [lat, lng] as produced by the map overlay (closed or open).
 */
export function ringAreaKm2(ring: [number, number][]): number | null {
  if (ring.length < 3) return null;
  const coords: [number, number][] = ring.map(([lat, lng]) => [lng, lat]);
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  const feature: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
  return area(feature) / 1_000_000;
}

/** Rough drive + fixed service time per stop (not turn-by-turn routing). */
export function estimateDrivePlusServiceMinutes(
  routeLengthKm: number,
  stopCount: number,
  options?: { avgKmh?: number; minutesPerStop?: number },
): number {
  const avgKmh = options?.avgKmh ?? 32;
  const minutesPerStop = options?.minutesPerStop ?? 4;
  const driveMin = (routeLengthKm / avgKmh) * 60;
  return Math.round(driveMin + stopCount * minutesPerStop);
}
