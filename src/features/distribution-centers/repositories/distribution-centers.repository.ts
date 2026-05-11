import { apiJson } from "@/lib/api-client";
import type { DistributionCenterDto } from "@/features/distribution-centers/domain/distribution-center.types";

export type AddDistributionCenterBody = {
  organizationId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type UpdateDistributionCenterBody = {
  name: string;
  latitude: number;
  longitude: number;
};

export const distributionCentersRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<DistributionCenterDto[]>(`/api/distributioncenters?${q}`, {
      method: "GET",
    });
  },

  add(body: AddDistributionCenterBody) {
    return apiJson<DistributionCenterDto>("/api/distributioncenters", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdateDistributionCenterBody) {
    return apiJson<DistributionCenterDto>(`/api/distributioncenters/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/distributioncenters/${id}`, {
      method: "DELETE",
    });
  },
};
