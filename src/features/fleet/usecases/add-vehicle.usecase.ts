import type { VehicleResponse } from "@/features/fleet/domain/vehicle.types";
import {
  vehiclesRepository,
  type AddVehicleBody,
} from "@/features/fleet/repositories/vehicles.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addVehicleUseCase(
  body: AddVehicleBody,
): Promise<VehicleResponse> {
  const res = await vehiclesRepository.add(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
