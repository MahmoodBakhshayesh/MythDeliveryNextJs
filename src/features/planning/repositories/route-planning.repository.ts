import { apiJson } from "@/lib/api-client";

export type GenerateDraftRoutesBody = {
  planningWindowId: string;
  spatialResolution?: number;
};

export type GenerateDraftRoutesResponseDto = {
  routesCreated: number;
  routeIds: string[];
  messages: string[];
};

export const routePlanningRepository = {
  generateDraftRoutes(body: GenerateDraftRoutesBody) {
    return apiJson<GenerateDraftRoutesResponseDto>(
      "/api/RoutePlanning/generate-draft-routes",
      {
        method: "POST",
        body: JSON.stringify({
          planningWindowId: body.planningWindowId,
          spatialResolution: body.spatialResolution ?? 8,
        }),
      },
    );
  },
};
