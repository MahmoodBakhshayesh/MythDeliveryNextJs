import { planningWindowsRepository } from "@/features/map/repositories/planning-windows.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function deletePlanningWindowUseCase(id: string): Promise<void> {
  const res = await planningWindowsRepository.delete(id);
  if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
}
