import { apiJson } from "@/lib/api-client";
import type { WorkPlanResponseDto } from "@/features/work-plans/domain/work-plan.types";

export type WorkPlanShiftRequest = {
  ordinal: number;
  localStart: string;
  localEnd: string;
};

export type AddWorkPlanBody = {
  organizationId: string;
  name: string;
  shifts: WorkPlanShiftRequest[];
};

export type UpdateWorkPlanBody = {
  name: string;
  shifts: WorkPlanShiftRequest[];
};

export const workPlansRepository = {
  list(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<WorkPlanResponseDto[]>(`/api/workplans?${q}`, {
      method: "GET",
    });
  },

  get(id: string) {
    return apiJson<WorkPlanResponseDto>(`/api/workplans/${id}`, {
      method: "GET",
    });
  },

  add(body: AddWorkPlanBody) {
    return apiJson<WorkPlanResponseDto>("/api/workplans", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdateWorkPlanBody) {
    return apiJson<WorkPlanResponseDto>(`/api/workplans/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/workplans/${id}`, { method: "DELETE" });
  },
};
