import { apiJson } from "@/lib/api-client";
import type {
  AddManagerBody,
  ManagerResponseDto,
} from "@/features/managers/domain/manager.types";

export const managersRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<ManagerResponseDto[]>(`/api/managers?${q}`, { method: "GET" });
  },

  add(body: AddManagerBody) {
    return apiJson<ManagerResponseDto>("/api/managers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/managers/${id}`, { method: "DELETE" });
  },
};
