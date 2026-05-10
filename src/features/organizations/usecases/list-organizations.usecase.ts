import { organizationsRepository } from "@/features/organizations/repositories/organizations.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import type { OrganizationResponse } from "@/types/api";

export async function listOrganizationsUseCase(): Promise<OrganizationResponse[]> {
  const res = await organizationsRepository.list();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
