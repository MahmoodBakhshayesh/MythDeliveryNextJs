import {
  organizationsRepository,
  type OrganizationEntityBody,
} from "@/features/organizations/repositories/organizations.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addOrganizationUseCase(
  name: string,
): Promise<OrganizationEntityBody> {
  const res = await organizationsRepository.add({ name: name.trim() });
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
