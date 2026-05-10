import { apiJson } from "@/lib/api-client";
import type { UserDirectoryEntry } from "@/types/api";

export type AddUserBody = {
  userName: string;
  password: string;
  passwordConfirm: string;
  email?: string | null;
  phoneNumber?: string | null;
  roleId?: string | null;
  /** Ignored by API when role is Admin. */
  organizationIds?: string[];
};

export type AdminUpdateUserBody = {
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  lockAccount?: boolean;
  /** Replaces org memberships; send [] for Admin users (clears links). */
  organizationIds?: string[];
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
