import {
  organizationsRepository,
  type OrganizationEntityBody,
} from "@/features/organizations/repositories/organizations.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function updateOrganizationUseCase(
  id: string,
  body: {
    name: string;
    description?: string | null;
    allowManualDeliveryStops?: boolean;
    showPlanWizardTimeZone?: boolean;
  },
): Promise<OrganizationEntityBody> {
  const res = await organizationsRepository.update(id, body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
