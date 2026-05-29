import { apiJson } from "@/lib/api-client";

export type OperationalClearBody = {
  message?: string;
};


export const maintenanceRepository = {
  clearOperationalData() {
    return apiJson<OperationalClearBody>(
      "/api/Maintenance/clear-operational-data?confirm=yes",
      { method: "POST" },
    );
  },
};
