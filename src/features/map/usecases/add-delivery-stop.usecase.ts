import type {
  AddDeliveryStopBody,
  DeliveryStopResponseDto,
} from "@/features/map/domain/planning-map.types";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function addDeliveryStopUseCase(
  body: AddDeliveryStopBody,
): Promise<DeliveryStopResponseDto> {
  const res = await deliveryStopsRepository.add(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
