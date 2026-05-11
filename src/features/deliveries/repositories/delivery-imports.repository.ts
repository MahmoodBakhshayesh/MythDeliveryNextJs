import { apiBlob, apiForm } from "@/lib/api-client";

export type ImportJobResponseDto = {
  id: string;
  organizationId: string;
  planningWindowId?: string | null;
  createdByUserId?: string | null;
  originalFileName: string;
  status: number;
  totalRows: number;
  importedRows: number;
  errorSummary?: string | null;
  completedAtUtc?: string | null;
};

export const deliveryImportsRepository = {
  downloadExcelTemplate() {
    return apiBlob("/api/DeliveryImports/excel-template");
  },

  importExcel(formData: FormData) {
    return apiForm<ImportJobResponseDto>(
      "/api/DeliveryImports/excel",
      formData,
      "POST",
    );
  },

  exportExcel(organizationId: string, planningWindowId?: string | null) {
    const q = new URLSearchParams({ organizationId });
    if (planningWindowId) q.set("planningWindowId", planningWindowId);
    return apiBlob(`/api/DeliveryImports/excel-export?${q.toString()}`);
  },

  exportExcelImportSchema(organizationId: string, planningWindowId?: string | null) {
    const q = new URLSearchParams({ organizationId });
    if (planningWindowId) q.set("planningWindowId", planningWindowId);
    return apiBlob(`/api/DeliveryImports/excel-export-import-schema?${q.toString()}`);
  },
};
