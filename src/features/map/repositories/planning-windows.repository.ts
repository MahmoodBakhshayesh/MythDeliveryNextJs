import { apiJson } from "@/lib/api-client";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";

export type AddPlanningWindowBody = {
  organizationId: string;
  createdByUserId?: string | null;
  name: string;
  workPlanId: string;
  /** yyyy-MM-dd */
  serviceDate: string;
  timeZoneId: string;
  distributionCenterId: string;
};

export type UpdatePlanningWindowBody = {
  name: string;
  workPlanId: string;
  serviceDate: string;
  timeZoneId: string;
  distributionCenterId?: string | null;
};

export type SetPlanningWindowDriverShiftsBody = {
  assignments: { driverId: string; shiftOrdinal: number }[];
};

export type ConfirmPlanningWindowBody = {
  strategy?: string | null;
  polygonAlgorithm?: string | null;
  confirmedByUserId?: string | null;
};

export const planningWindowsRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<PlanningWindowResponseDto[]>(
      `/api/planningwindows?${q}`,
      { method: "GET" },
    );
  },

  getById(id: string) {
    return apiJson<PlanningWindowResponseDto>(`/api/planningwindows/${id}`, {
      method: "GET",
    });
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

  confirm(id: string, body: ConfirmPlanningWindowBody) {
    return apiJson<PlanningWindowResponseDto>(`/api/planningwindows/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  reopen(id: string) {
    return apiJson<PlanningWindowResponseDto>(`/api/planningwindows/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  setDriverShifts(id: string, body: SetPlanningWindowDriverShiftsBody) {
    return apiJson<PlanningWindowResponseDto>(
      `/api/planningwindows/${id}/driver-shifts`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  },
};
