import type { AddManagerBody } from "@/features/managers/domain/manager.types";
import type { ManagerResponseDto } from "@/features/managers/domain/manager.types";
import { managersRepository } from "@/features/managers/repositories/managers.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addManagerUseCase(
  body: AddManagerBody,
): Promise<ManagerResponseDto> {
  const res = await managersRepository.add(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
