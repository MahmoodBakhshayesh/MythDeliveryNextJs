import type { DriverResponse } from "@/features/drivers/domain/driver.types";

export type DriverPortalProfileResponse = {
  driver: DriverResponse;
  email?: string | null;
};

export type UpdateDriverPortalProfileBody = {
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
};

export type UpdatePlanningVehiclePreferenceBody = {
  preferPersonalVehicleForPlanning: boolean;
};

export type DriverFleetVehicleAssignmentRow = {
  assignmentId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  vehicle: PersonalFleetVehicleSnapshot;
};

/** Subset of fleet vehicle info returned by driver portal. */
export type PersonalFleetVehicleSnapshot = {
  id: string;
  organizationId: string;
  name: string;
  plateNumber?: string | null;
  isActive: boolean;
};

export type AddPersonalVehicleBody = {
  name: string;
  plateNumber?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
};

export type UpdatePersonalVehicleBody = {
  name: string;
  plateNumber?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
  isActive: boolean;
};

/** Route row from GET /api/driver-portal/routes — mirrors RouteResponse (camelCase JSON). */
export type DriverPortalRouteDto = {
  id: string;
  planningWindowId: string;
  driverId: string;
  vehicleId: string;
  driverName?: string | null;
  vehicleName?: string | null;
  name?: string | null;
  status: number;
  plannedStartUtc?: string | null;
  plannedEndUtc?: string | null;
  startStorageName?: string | null;
  stops: {
    id: string;
    deliveryStopId: string;
    sequence: number;
    recipientName?: string | null;
    latitude: number;
    longitude: number;
  }[];
};

export type PersonalVehicleDto = {
  id: string;
  organizationId: string;
  ownerDriverId?: string | null;
  name: string;
  plateNumber?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
  maxWeightKg: number;
  maxVolumeM3: number;
  maxStopsPerRoute?: number | null;
  isActive: boolean;
};
