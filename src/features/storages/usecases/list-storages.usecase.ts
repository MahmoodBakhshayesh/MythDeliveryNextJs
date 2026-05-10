import { storagesRepository } from "@/features/storages/repositories/storages.repository";
import type { StorageDto } from "@/features/storages/domain/storage.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listStoragesUseCase(
  organizationId: string,
): Promise<StorageDto[]> {
  const res = await storagesRepository.listByOrganization(organizationId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
