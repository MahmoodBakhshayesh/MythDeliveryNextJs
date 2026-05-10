/** API-aligned types (camelCase JSON). */

export type DeliveryStopResponseDto = {
  id: string;
  organizationId: string;
  planningWindowId?: string | null;
  recipientName: string;
  phone?: string | null;
  latitude: number;
  longitude: number;
  addressLine1?: string | null;
  city?: string | null;
  serviceMinutes?: number;
  serviceDate?: string | null;
  timeSection?: number | null;
  status?: number;
};

export type RouteStopDto = {
  id: string;
  deliveryStopId: string;
  sequence: number;
  recipientName?: string | null;
  latitude: number;
  longitude: number;
};

export type RouteResponseDto = {
  id: string;
  planningWindowId: string;
  driverId: string;
  vehicleId: string;
  driverName?: string | null;
  stops: RouteStopDto[];
};

export type DispatchShiftDto = {
  id: string;
  ordinal: number;
  startsAtUtc: string;
  endsAtUtc: string;
};

export type PlanningWindowDriverShiftDto = {
  driverId: string;
  shiftOrdinal: number;
};

export type PlanningWindowResponseDto = {
  id: string;
  organizationId: string;
  name: string;
  startsAtUtc: string;
  endsAtUtc: string;
  timeZoneId: string;
  workPlanId: string;
  /** yyyy-MM-dd */
  serviceDate: string;
  /** Depot used as route start for drivers. */
  storageId?: string | null;
  isConfirmed?: boolean;
  confirmedAtUtc?: string | null;
  confirmedByUserId?: string | null;
  confirmedStrategy?: string | null;
  confirmedPolygonAlgorithm?: string | null;
  dispatchShifts?: DispatchShiftDto[];
  driverShifts?: PlanningWindowDriverShiftDto[];
};

export type AddDeliveryStopBody = {
  organizationId: string;
  planningWindowId?: string | null;
  recipientName: string;
  latitude: number;
  longitude: number;
  addressLine1?: string | null;
  phone?: string | null;
  serviceMinutes?: number;
  serviceDate?: string | null;
  timeSection?: number | null;
};

export type RouteLayerModel = {
  routeId: string;
  driverId: string;
  driverName: string;
  color: string;
  polyline: [number, number][];
  hull: [number, number][] | null;
};

export type StopPinModel = {
  id: string;
  recipientName: string;
  lat: number;
  lng: number;
  color: string;
  /** Visit order on assigned route (when known). */
  sequence?: number | null;
};

export type MapOverlayModel = {
  routes: RouteLayerModel[];
  stops: StopPinModel[];
  boundsPoints: [number, number][];
};

/** How shaded regions around each route’s stops are computed on the map. */
export type PolygonRegionAlgorithm =
  | "convexHull"
  | "concaveHull"
  | "boundingBox"
  | "none";

export const POLYGON_REGION_OPTIONS: ReadonlyArray<{
  value: PolygonRegionAlgorithm;
  label: string;
  description: string;
}> = [
  {
    value: "convexHull",
    label: "Convex hull",
    description:
      "Outermost polygon wrapping all stops—smooth and stable for sparse routes.",
  },
  {
    value: "concaveHull",
    label: "Concave hull",
    description:
      "Tighter outline that follows clusters better than a plain convex hull.",
  },
  {
    value: "boundingBox",
    label: "Bounding rectangle",
    description:
      "Axis-aligned box around stops—fast and easy to compare areas.",
  },
  {
    value: "none",
    label: "Routes only",
    description: "Hide shaded regions; show sequence lines and stop markers only.",
  },
];

export const POLYGON_REGION_STORAGE_KEY = "planningMap.polygonRegionAlgorithm";

