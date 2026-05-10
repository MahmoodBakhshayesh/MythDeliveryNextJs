import { apiJson } from "@/lib/api-client";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";

export const planningWindowsRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<PlanningWindowResponseDto[]>(
      `/api/planningwindows?${q}`,
      { method: "GET" },
    );
  },
};
