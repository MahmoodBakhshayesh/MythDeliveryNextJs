import { usersRepository } from "@/features/users/repositories/users.repository";
import type { UserDirectoryEntry } from "@/types/api";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listUsersUseCase(): Promise<UserDirectoryEntry[]> {
  const res = await usersRepository.list();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
