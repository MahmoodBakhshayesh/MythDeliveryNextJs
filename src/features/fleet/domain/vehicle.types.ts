export type VehicleResponse = {
  id: string;
  organizationId: string;
  name: string;
  plateNumber?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
  maxWeightKg: number;
  maxVolumeM3: number;
  maxStopsPerRoute?: number | null;
  isActive: boolean;
};
