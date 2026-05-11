import type { AddDistributionCenterBody } from "@/features/distribution-centers/repositories/distribution-centers.repository";
import type { DistributionCenterDto } from "@/features/distribution-centers/domain/distribution-center.types";
import { distributionCentersRepository } from "@/features/distribution-centers/repositories/distribution-centers.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addDistributionCenterUseCase(
  body: AddDistributionCenterBody,
): Promise<DistributionCenterDto> {
  const res = await distributionCentersRepository.add(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
