import { apiJson } from "@/lib/api-client";
import type {
  AddPersonalVehicleBody,
  DriverFleetVehicleAssignmentRow,
  DriverPortalProfileResponse,
  PersonalVehicleDto,
  UpdateDriverPortalProfileBody,
  UpdatePersonalVehicleBody,
  UpdatePlanningVehiclePreferenceBody,
} from "@/features/driver-portal/domain/driver-portal.types";

export const driverPortalRepository = {
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
