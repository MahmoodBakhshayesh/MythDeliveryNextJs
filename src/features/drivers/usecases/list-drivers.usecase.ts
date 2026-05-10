import { driversRepository } from "@/features/drivers/repositories/drivers.repository";
import type { DriverResponse } from "@/features/drivers/domain/driver.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listDriversUseCase(
  organizationId: string,
): Promise<DriverResponse[]> {
  const res = await driversRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body.map((d) => ({
    ...d,
    appUserId: d.appUserId ?? "",
    preferPersonalVehicleForPlanning: Boolean(d.preferPersonalVehicleForPlanning),
  }));
}
