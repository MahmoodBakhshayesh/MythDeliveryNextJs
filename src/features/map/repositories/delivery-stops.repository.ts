import { apiJson } from "@/lib/api-client";
import type {
  AddDeliveryStopBody,
  DeliveryStopResponseDto,
} from "@/features/map/domain/planning-map.types";

export const deliveryStopsRepository = {
  list(organizationId: string, planningWindowId?: string | null) {
    const q = new URLSearchParams({ organizationId });
    if (planningWindowId) q.set("planningWindowId", planningWindowId);
    return apiJson<DeliveryStopResponseDto[]>(
      `/api/deliverystops?${q}`,
      { method: "GET" },
    );
  },

  add(body: AddDeliveryStopBody) {
    return apiJson<DeliveryStopResponseDto>("/api/deliverystops", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/deliverystops/${id}`, {
      method: "DELETE",
    });
  },
};
