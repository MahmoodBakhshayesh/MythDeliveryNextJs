import { apiJson } from "@/lib/api-client";
import type {
  AddDriverVehicleAssignmentBody,
  DriverVehicleAssignmentResponse,
  UpdateDriverVehicleAssignmentBody,
} from "@/features/drivers/domain/driver.types";

export const driverVehicleAssignmentsRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<DriverVehicleAssignmentResponse[]>(
      `/api/drivervehicleassignments?${q}`,
      { method: "GET" },
    );
  },

  add(body: AddDriverVehicleAssignmentBody) {
    return apiJson<DriverVehicleAssignmentResponse>("/api/drivervehicleassignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdateDriverVehicleAssignmentBody) {
    return apiJson<DriverVehicleAssignmentResponse>(
      `/api/drivervehicleassignments/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/drivervehicleassignments/${id}`, {
      method: "DELETE",
    });
  },
};
