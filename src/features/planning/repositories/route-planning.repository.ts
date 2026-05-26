import { apiBlob, apiJson } from "@/lib/api-client";

export type GenerateDraftRoutesBody = {
  planningWindowId: string;
  spatialResolution?: number;
  planningStrategy?: string;
  selectedVehicleIds?: string[];
};

export type AssignRouteDriversBody = {
  planningWindowId: string;
  assignments: { routeId: string; driverId: string }[];
};

export type GenerateDraftRoutesResponseDto = {
  routesCreated: number;
  routeIds: string[];
  messages: string[];
};

export type DriverInstructionsResponseDto = {
  planningWindowId: string;
  routes: {
    routeId: string;
    driverId: string;
    driverName: string;
    vehicleId: string;
    vehicleName?: string | null;
    steps: {
      sequence: number;
      deliveryStopId: string;
      recipientName: string;
      addressLine1?: string | null;
      city?: string | null;
      phone?: string | null;
      latitude: number;
      longitude: number;
      packageBarcodes: string[];
    }[];
  }[];
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
          planningStrategy: body.planningStrategy ?? "SpatialCell",
          selectedVehicleIds: body.selectedVehicleIds ?? [],
        }),
      },
    );
  },

  assignRouteDrivers(body: AssignRouteDriversBody) {
    return apiJson<null>("/api/RoutePlanning/assign-route-drivers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getDriverInstructions(planningWindowId: string) {
    return apiJson<DriverInstructionsResponseDto>(
      `/api/routes/by-planning-window/${planningWindowId}/driver-instructions`,
      { method: "GET" },
    );
  },

  downloadFleetReportPdf(planningWindowId: string) {
    return apiBlob(
      `/api/routes/by-planning-window/${planningWindowId}/report/fleet.pdf`,
    );
  },

  downloadDriverReportsZip(planningWindowId: string) {
    return apiBlob(
      `/api/routes/by-planning-window/${planningWindowId}/report/drivers.zip`,
    );
  },
};
