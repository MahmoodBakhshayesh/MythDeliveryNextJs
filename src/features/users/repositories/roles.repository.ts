import { apiJson } from "@/lib/api-client";
import type { RoleOption } from "@/types/api";

export const rolesRepository = {
  list() {
    return apiJson<RoleOption[]>("/api/roles", { method: "GET" });
  },
};
