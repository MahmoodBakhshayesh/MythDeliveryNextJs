import { apiJson } from "@/lib/api-client";
import type { RouteResponseDto } from "@/features/map/domain/planning-map.types";

export const routesRepository = {
  listByPlanningWindow(planningWindowId: string) {
    return apiJson<RouteResponseDto[]>(
      `/api/routes/by-planning-window/${planningWindowId}`,
      { method: "GET" },
    );
  },
};
