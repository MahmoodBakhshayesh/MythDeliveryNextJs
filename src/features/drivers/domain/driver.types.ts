export type DriverResponse = {
  id: string;
  organizationId: string;
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
};

export type AddDriverBody = {
  organizationId: string;
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean;
};

export type UpdateDriverBody = {
  appUserId?: string | null;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
};

export type DriverVehicleAssignmentResponse = {
  id: string;
  driverId: string;
  vehicleId: string;
  driverDisplayName?: string | null;
  vehicleName?: string | null;
  effectiveFromUtc: string;
  effectiveToUtc?: string | null;
};

export type AddDriverVehicleAssignmentBody = {
  driverId: string;
  vehicleId: string;
  effectiveFromUtc: string;
  effectiveToUtc?: string | null;
};

export type UpdateDriverVehicleAssignmentBody = {
  effectiveFromUtc: string;
  effectiveToUtc?: string | null;
};
