import { planningWindowsRepository } from "@/features/map/repositories/planning-windows.repository";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listPlanningWindowsUseCase(
  organizationId: string,
): Promise<PlanningWindowResponseDto[]> {
  const res =
    await planningWindowsRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
