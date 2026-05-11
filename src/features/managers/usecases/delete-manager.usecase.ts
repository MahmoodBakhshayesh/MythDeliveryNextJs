import { managersRepository } from "@/features/managers/repositories/managers.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function deleteManagerUseCase(id: string): Promise<void> {
  const res = await managersRepository.delete(id);
  if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
}
