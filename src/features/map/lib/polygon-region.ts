import { convex } from "@turf/convex";
import type { FeatureCollection, Point } from "geojson";
import type { PolygonRegionAlgorithm } from "@/features/map/domain/planning-map.types";

/** Turf `convex` wraps concaveman; lower concavity follows clusters more tightly. */
const CONCAVE_HULL_CONCAVITY = 2;

function toPointCollection(
  points: { latitude: number; longitude: number }[],
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [p.longitude, p.latitude],
      },
    })),
  };
}

function ringLngLatToLeaflet(ring: [number, number][]): [number, number][] {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function turfHullRing(
  sorted: { latitude: number; longitude: number }[],
  concavity: number,
): [number, number][] | null {
  if (sorted.length < 3) return null;
  const fc = toPointCollection(sorted);
  const hull = convex(fc, { concavity });
  const ring = hull?.geometry?.coordinates?.[0];
  if (!ring?.length) return null;
  return ringLngLatToLeaflet(ring as [number, number][]);
}

function boundingBoxRing(
  sorted: { latitude: number; longitude: number }[],
): [number, number][] | null {
  if (sorted.length < 2) return null;
  const lats = sorted.map((s) => s.latitude);
  const lngs = sorted.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, maxLng],
    [maxLat, minLng],
    [minLat, minLng],
  ];
}

/**
 * Closed ring in Leaflet order [lat, lng] for the shaded route region, or null.
 */
export function computeRouteRegionRing(
  sortedStops: { latitude: number; longitude: number }[],
  algorithm: PolygonRegionAlgorithm,
): [number, number][] | null {
  switch (algorithm) {
    case "none":
      return null;
    case "boundingBox":
      return boundingBoxRing(sortedStops);
    case "convexHull":
      return turfHullRing(sortedStops, Infinity);
    case "concaveHull":
      return turfHullRing(sortedStops, CONCAVE_HULL_CONCAVITY);
    default: {
      const _exhaustive: never = algorithm;
      return _exhaustive;
    }
  }
}
