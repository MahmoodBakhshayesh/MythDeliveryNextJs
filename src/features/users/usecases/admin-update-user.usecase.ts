import type { UserDirectoryEntry } from "@/types/api";
import {
  usersRepository,
  type AdminUpdateUserBody,
} from "@/features/users/repositories/users.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function adminUpdateUserUseCase(
  userId: string,
  body: AdminUpdateUserBody,
): Promise<UserDirectoryEntry> {
  const res = await usersRepository.adminUpdate(userId, body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
