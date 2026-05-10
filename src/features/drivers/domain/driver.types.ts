export type DriverResponse = {
  id: string;
  organizationId: string;
  appUserId: string;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
  preferPersonalVehicleForPlanning: boolean;
};

/** POST /api/drivers — creates Identity user (Driver role), org membership, and driver row. */
export type AddDriverBody = {
  organizationId: string;
  email: string;
  /** If omitted, API defaults to email. */
  userName?: string | null;
  password: string;
  passwordConfirm: string;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  preferPersonalVehicleForPlanning: boolean;
};

export type UpdateDriverBody = {
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
  preferPersonalVehicleForPlanning: boolean;
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
