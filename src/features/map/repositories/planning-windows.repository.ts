import { apiJson } from "@/lib/api-client";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";

export type AddPlanningWindowBody = {
  organizationId: string;
  createdByUserId?: string | null;
  name: string;
  startsAtUtc: string;
  endsAtUtc: string;
  timeZoneId?: string | null;
};

export type UpdatePlanningWindowBody = {
  name: string;
  startsAtUtc: string;
  endsAtUtc: string;
  timeZoneId?: string | null;
};

export const planningWindowsRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<PlanningWindowResponseDto[]>(
      `/api/planningwindows?${q}`,
      { method: "GET" },
    );
  },

  add(body: AddPlanningWindowBody) {
    return apiJson<PlanningWindowResponseDto>("/api/planningwindows", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdatePlanningWindowBody) {
    return apiJson<PlanningWindowResponseDto>(`/api/planningwindows/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/planningwindows/${id}`, {
      method: "DELETE",
    });
  },
};
