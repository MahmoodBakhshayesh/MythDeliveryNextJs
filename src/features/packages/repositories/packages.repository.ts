import { apiJson } from "@/lib/api-client";
import type { DeliveryPackageResponse } from "@/features/packages/domain/package.types";

export const packagesRepository = {
  list(organizationId: string, deliveryStopId?: string) {
    const q = new URLSearchParams({ organizationId });
    if (deliveryStopId) q.set("deliveryStopId", deliveryStopId);
    return apiJson<DeliveryPackageResponse[]>(
      `/api/deliverypackages?${q}`,
      { method: "GET" },
    );
  },
};
