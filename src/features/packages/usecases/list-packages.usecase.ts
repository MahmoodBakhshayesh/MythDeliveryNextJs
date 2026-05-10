import type { DeliveryPackageResponse } from "@/features/packages/domain/package.types";
import { packagesRepository } from "@/features/packages/repositories/packages.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listPackagesUseCase(
  organizationId: string,
  deliveryStopId?: string,
): Promise<DeliveryPackageResponse[]> {
  const res = await packagesRepository.list(organizationId, deliveryStopId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
