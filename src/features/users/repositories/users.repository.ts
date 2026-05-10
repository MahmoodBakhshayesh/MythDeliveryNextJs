import { apiJson } from "@/lib/api-client";
import type { UserDirectoryEntry } from "@/types/api";

export type AddUserBody = {
  userName: string;
  password: string;
  passwordConfirm: string;
  email?: string | null;
  phoneNumber?: string | null;
  roleId?: string | null;
};

export type AdminUpdateUserBody = {
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  lockAccount?: boolean;
};

export const usersRepository = {
  list() {
    return apiJson<UserDirectoryEntry[]>("/api/users", { method: "GET" });
  },

  add(body: AddUserBody) {
    return apiJson<UserDirectoryEntry>("/api/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminUpdate(userId: string, body: AdminUpdateUserBody) {
    return apiJson<UserDirectoryEntry>(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};
