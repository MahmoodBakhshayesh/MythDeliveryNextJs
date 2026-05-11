import { distributionCentersRepository } from "@/features/distribution-centers/repositories/distribution-centers.repository";
import type { DistributionCenterDto } from "@/features/distribution-centers/domain/distribution-center.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listDistributionCentersUseCase(
  organizationId: string,
): Promise<DistributionCenterDto[]> {
  const res = await distributionCentersRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
