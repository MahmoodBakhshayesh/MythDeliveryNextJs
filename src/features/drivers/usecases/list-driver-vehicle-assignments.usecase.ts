import type { DriverVehicleAssignmentResponse } from "@/features/drivers/domain/driver.types";
import { driverVehicleAssignmentsRepository } from "@/features/drivers/repositories/driver-vehicle-assignments.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listDriverVehicleAssignmentsUseCase(
  organizationId: string,
): Promise<DriverVehicleAssignmentResponse[]> {
  const res =
    await driverVehicleAssignmentsRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
