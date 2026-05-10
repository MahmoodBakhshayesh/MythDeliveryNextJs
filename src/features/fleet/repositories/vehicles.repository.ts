import { apiJson } from "@/lib/api-client";
import type { VehicleResponse } from "@/features/fleet/domain/vehicle.types";

export type AddVehicleBody = {
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

export const vehiclesRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<VehicleResponse[]>(`/api/vehicles?${q}`, {
      method: "GET",
    });
  },

  add(body: AddVehicleBody) {
    return apiJson<VehicleResponse>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
