import { apiJson } from "@/lib/api-client";

export type MovePlanningRouteStopBody = {
  routeStopId: string;
  targetRouteId: string;
};

export type MergePlanningRoutesBody = {
  sourceRouteId: string;
  targetRouteId: string;
  /** Driver who owns the merged (surviving) route. Omit to keep the target route’s driver. */
  resultDriverId?: string;
};

export type SplitPlanningRouteBody = {
  splitBeforeRouteStopId: string;
  /** Driver for the new tail route. Omit to keep the same driver as the route being split. */
  newRouteDriverId?: string;
};

export type RemovePlanningRouteVisitBody = {
  routeStopId: string;
};

export const planningRouteEditsRepository = {
  moveStop(planningWindowId: string, body: MovePlanningRouteStopBody) {
    return apiJson<unknown>(
      `/api/planning-windows/${planningWindowId}/route-edits/move-stop`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  mergeRoutes(planningWindowId: string, body: MergePlanningRoutesBody) {
    return apiJson<unknown>(
      `/api/planning-windows/${planningWindowId}/route-edits/merge-routes`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  splitRoute(planningWindowId: string, body: SplitPlanningRouteBody) {
    return apiJson<unknown>(
      `/api/planning-windows/${planningWindowId}/route-edits/split-route`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  removeVisitFromRoute(
    planningWindowId: string,
    body: RemovePlanningRouteVisitBody,
  ) {
    return apiJson<unknown>(
      `/api/planning-windows/${planningWindowId}/route-edits/remove-visit`,
      {
        method: "POST",
        body: JSON.stringify({ routeStopId: body.routeStopId }),
      },
    );
  },
};
