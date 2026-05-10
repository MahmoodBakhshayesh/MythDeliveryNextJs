import { apiJson } from "@/lib/api-client";
import type {
  AddDriverBody,
  DriverResponse,
  UpdateDriverBody,
} from "@/features/drivers/domain/driver.types";

export const driversRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<DriverResponse[]>(`/api/drivers?${q}`, { method: "GET" });
  },

  add(body: AddDriverBody) {
    return apiJson<DriverResponse>("/api/drivers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdateDriverBody) {
    return apiJson<DriverResponse>(`/api/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/drivers/${id}`, { method: "DELETE" });
  },
};
