import { apiJson } from "@/lib/api-client";
import type { StorageDto } from "@/features/storages/domain/storage.types";

export type AddStorageBody = {
  organizationId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type UpdateStorageBody = {
  name: string;
  latitude: number;
  longitude: number;
};

export const storagesRepository = {
  listByOrganization(organizationId: string) {
    const q = new URLSearchParams({ organizationId });
    return apiJson<StorageDto[]>(`/api/storages?${q}`, {
      method: "GET",
    });
  },

  add(body: AddStorageBody) {
    return apiJson<StorageDto>("/api/storages", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: UpdateStorageBody) {
    return apiJson<StorageDto>(`/api/storages/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(id: string) {
    return apiJson<unknown>(`/api/storages/${id}`, {
      method: "DELETE",
    });
  },
};
