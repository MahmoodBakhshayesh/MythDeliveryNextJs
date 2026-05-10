import type {
  DeliveryStopResponseDto,
  RouteResponseDto,
} from "@/features/map/domain/planning-map.types";
import { deliveryStopsRepository } from "@/features/map/repositories/delivery-stops.repository";
import { routesRepository } from "@/features/map/repositories/routes.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export type PlanningMapSnapshot = {
  stops: DeliveryStopResponseDto[];
  routes: RouteResponseDto[];
};

export async function loadPlanningMapUseCase(
  organizationId: string,
  planningWindowId: string,
): Promise<PlanningMapSnapshot> {
  const [stopsRes, routesRes] = await Promise.all([
    deliveryStopsRepository.list(organizationId, planningWindowId),
    routesRepository.listByPlanningWindow(planningWindowId),
  ]);

  if (!isAppSuccess(stopsRes) || !stopsRes.body) {
    throw new Error(appErrorMessage(stopsRes));
  }
  if (!isAppSuccess(routesRes) || !routesRes.body) {
    throw new Error(appErrorMessage(routesRes));
  }

  return { stops: stopsRes.body, routes: routesRes.body };
}
