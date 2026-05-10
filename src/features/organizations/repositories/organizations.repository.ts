import { apiJson } from "@/lib/api-client";
import type { OrganizationResponse } from "@/types/api";

export type OrganizationEntityBody = {
  id: string;
  name: string;
  description?: string | null;
};

export const organizationsRepository = {
  list() {
    return apiJson<OrganizationResponse[]>("/api/organizations", {
      method: "GET",
    });
  },

  getById(id: string) {
    return apiJson<OrganizationResponse>(`/api/organizations/${id}`, {
      method: "GET",
    });
  },

  add(body: { name: string }) {
    return apiJson<OrganizationEntityBody>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: { name: string; description?: string | null }) {
    return apiJson<OrganizationEntityBody>(`/api/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};
