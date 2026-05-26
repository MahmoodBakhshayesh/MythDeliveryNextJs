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
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  serviceDate?: string | null;
  timeSection?: number | null;
  status?: number;
  orderId?: string | null;
  selectedRouteId?: string | null;
  selectedRouteStopId?: string | null;
  selectedRouteSequence?: number | null;
  notes?: string | null;
  externalRef?: string | null;
  weightKg?: number | null;
  volumeM3?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
};

/** Body for PUT /api/deliverystops/{id} (matches API contract). */
export type UpdateDeliveryStopBody = {
  planningWindowId?: string | null;
  recipientName: string;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude: number;
  longitude: number;
  weightKg?: number | null;
  volumeM3?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  serviceDate?: string | null;
  timeSection?: number | null;
  orderId?: string | null;
  notes?: string | null;
  externalRef?: string | null;
};

/** Context for route/stop editing overlays on the planning map. */
export type RouteStopEditMapContext = {
  planningWindowId: string;
  organizationId: string;
  isConfirmed: boolean;
  routes: RouteResponseDto[];
  stops: DeliveryStopResponseDto[];
  onAfterMutation: () => Promise<void>;
  repositioningDeliveryStopId: string | null;
  onRepositioningDeliveryStopChange: (id: string | null) => void;
  onEditDeliveryStop: (deliveryStopId: string) => void;
  onRepositionDragEnd: (deliveryStopId: string, lat: number, lng: number) => void;
  removeVisit: (routeStopId: string) => Promise<void>;
  deleteStop: (deliveryStopId: string) => Promise<void>;
  /** True while update/remove/delete stop mutations run (from map controller). */
  stopEditBusy: boolean;
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
  driverId?: string | null;
  vehicleId: string;
  driverName?: string | null;
  vehicleName?: string | null;
  name?: string | null;
  isSelected?: boolean;
  /** RouteStatus from API (0 Draft … 4 Cancelled). */
  status?: number;
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
  distributionCenterId?: string | null;
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
  orderId?: string | null;
  latitude: number;
  longitude: number;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  timeSection?: number | null;
  notes?: string | null;
  externalRef?: string | null;
  lineItems?: {
    sku?: string | null;
    description?: string | null;
    quantity?: number;
    weightKg?: number | null;
    volumeM3?: number | null;
  }[];
};

export type RouteLayerModel = {
  routeId: string;
  driverId?: string | null;
  driverName: string;
  color: string;
  polyline: [number, number][];
  hull: [number, number][] | null;
};

export type StopPinModel = {
  /** Delivery stop id (matches `DeliveryStopResponseDto.id`). */
  id: string;
  recipientName: string;
  lat: number;
  lng: number;
  color: string;
  /** Visit order on assigned route (when known). */
  sequence?: number | null;
  /** Present when this stop is linked to a draft route visit (for route-edit APIs). */
  routeStopId?: string | null;
  routeId?: string | null;
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
  | "partitionNoOverlap"
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
    value: "partitionNoOverlap",
    label: "Partition (no overlap)",
    description:
      "Convex outline per route, then trim overlaps in stable route order so shaded regions do not stack.",
  },
  {
    value: "none",
    label: "Routes only",
    description: "Hide shaded regions; show sequence lines and stop markers only.",
  },
];

export const POLYGON_REGION_STORAGE_KEY = "planningMap.polygonRegionAlgorithm";

