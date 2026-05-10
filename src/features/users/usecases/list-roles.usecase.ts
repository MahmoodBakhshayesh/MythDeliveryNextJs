import { rolesRepository } from "@/features/users/repositories/roles.repository";
import type { RoleOption } from "@/types/api";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listRolesUseCase(): Promise<RoleOption[]> {
  const res = await rolesRepository.list();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
