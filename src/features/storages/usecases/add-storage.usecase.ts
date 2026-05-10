import type { AddStorageBody } from "@/features/storages/repositories/storages.repository";
import type { StorageDto } from "@/features/storages/domain/storage.types";
import { storagesRepository } from "@/features/storages/repositories/storages.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addStorageUseCase(
  body: AddStorageBody,
): Promise<StorageDto> {
  const res = await storagesRepository.add(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
