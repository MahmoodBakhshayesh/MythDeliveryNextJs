import {
  planningWindowsRepository,
  type UpdatePlanningWindowBody,
} from "@/features/map/repositories/planning-windows.repository";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function updatePlanningWindowUseCase(
  id: string,
  body: UpdatePlanningWindowBody,
): Promise<PlanningWindowResponseDto> {
  const res = await planningWindowsRepository.update(id, body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
