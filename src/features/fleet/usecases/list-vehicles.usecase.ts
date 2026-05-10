import type { VehicleResponse } from "@/features/fleet/domain/vehicle.types";
import { vehiclesRepository } from "@/features/fleet/repositories/vehicles.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listVehiclesUseCase(
  organizationId: string,
): Promise<VehicleResponse[]> {
  const res = await vehiclesRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
