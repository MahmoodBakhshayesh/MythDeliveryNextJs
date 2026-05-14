export type DriverResponse = {
  id: string;
  organizationId: string;
  distributionCenterId: string;
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
  distributionCenterId: string;
  userName: string;
  /** Optional; when set must be globally unique. */
  email?: string | null;
  password: string;
  passwordConfirm: string;
  displayName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  preferPersonalVehicleForPlanning: boolean;
};

export type UpdateDriverBody = {
  /** Supervisor may move the driver to another depot in the same organization. */
  distributionCenterId?: string | null;
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
