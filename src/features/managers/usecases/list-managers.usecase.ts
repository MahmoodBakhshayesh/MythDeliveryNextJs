import { managersRepository } from "@/features/managers/repositories/managers.repository";
import type { ManagerResponseDto } from "@/features/managers/domain/manager.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listManagersUseCase(
  organizationId: string,
): Promise<ManagerResponseDto[]> {
  const res = await managersRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
