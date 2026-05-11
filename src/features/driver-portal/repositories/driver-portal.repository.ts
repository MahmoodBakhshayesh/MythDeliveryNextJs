import { apiJson } from "@/lib/api-client";
import type { PlanningWindowResponseDto } from "@/features/map/domain/planning-map.types";
import type { DeliveryPackageResponse } from "@/features/packages/domain/package.types";
import type {
  AddPersonalVehicleBody,
  DriverFleetVehicleAssignmentRow,
  DriverPortalProfileResponse,
  DriverPortalRouteDto,
  PersonalVehicleDto,
  UpdateDriverPortalProfileBody,
  UpdatePersonalVehicleBody,
  UpdatePlanningVehiclePreferenceBody,
} from "@/features/driver-portal/domain/driver-portal.types";

export const driverPortalRepository = {
  listMyPlanningWindows() {
    return apiJson<PlanningWindowResponseDto[]>("/api/driver-portal/planning-windows", {
      method: "GET",
    });
  },

  listMyRoutes(planningWindowId: string) {
    const q = new URLSearchParams({ planningWindowId });
    return apiJson<DriverPortalRouteDto[]>(
      `/api/driver-portal/routes?${q.toString()}`,
      { method: "GET" },
    );
  },

  listMyHandledPackages(planningWindowId?: string) {
    const path =
      planningWindowId != null && planningWindowId !== ""
        ? `/api/driver-portal/packages/handled?planningWindowId=${encodeURIComponent(planningWindowId)}`
        : "/api/driver-portal/packages/handled";
    return apiJson<DeliveryPackageResponse[]>(path, { method: "GET" });
  },

  getProfile() {
    return apiJson<DriverPortalProfileResponse>("/api/driver-portal/profile", {
      method: "GET",
    });
  },

  updateProfile(body: UpdateDriverPortalProfileBody) {
    return apiJson<DriverPortalProfileResponse>("/api/driver-portal/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  updatePlanningPreference(body: UpdatePlanningVehiclePreferenceBody) {
    return apiJson<DriverPortalProfileResponse>(
      "/api/driver-portal/profile/planning-vehicle-preference",
      { method: "PUT", body: JSON.stringify(body) },
    );
  },

  listFleetAssignments() {
    return apiJson<DriverFleetVehicleAssignmentRow[]>(
      "/api/driver-portal/vehicles/fleet-assignments",
      { method: "GET" },
    );
  },

  listPersonalVehicles() {
    return apiJson<PersonalVehicleDto[]>(
      "/api/driver-portal/vehicles/personal",
      { method: "GET" },
    );
  },

  addPersonalVehicle(body: AddPersonalVehicleBody) {
    return apiJson<PersonalVehicleDto>("/api/driver-portal/vehicles/personal", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updatePersonalVehicle(id: string, body: UpdatePersonalVehicleBody) {
    return apiJson<PersonalVehicleDto>(
      `/api/driver-portal/vehicles/personal/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
  },

  deletePersonalVehicle(id: string) {
    return apiJson<unknown>(`/api/driver-portal/vehicles/personal/${id}`, {
      method: "DELETE",
    });
  },
};
