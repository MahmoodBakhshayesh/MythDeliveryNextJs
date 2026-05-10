import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import type { DeliveryStopResponseDto } from "@/features/map/domain/planning-map.types";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function listDeliveryStopsUseCase(
  organizationId: string,
  planningWindowId?: string | null,
): Promise<DeliveryStopResponseDto[]> {
  const res = await deliveryStopsRepository.list(organizationId, planningWindowId);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
