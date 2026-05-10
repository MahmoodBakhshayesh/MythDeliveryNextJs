import { apiForm, apiJson } from "@/lib/api-client";
import type { UserProfileResponse } from "@/types/api";

export const profileRepository = {
  getMe() {
    return apiJson<UserProfileResponse>("/api/users/me", { method: "GET" });
  },

  updateMe(body: {
    displayName?: string | null;
    phoneNumber?: string | null;
    bio?: string | null;
  }) {
    return apiJson<UserProfileResponse>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  changePassword(body: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return apiJson<unknown>("/api/users/me/password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return apiForm<UserProfileResponse>("/api/users/me/avatar", fd);
  },

  clearAvatar() {
    return apiJson<UserProfileResponse>("/api/users/me/avatar", {
      method: "DELETE",
    });
  },
};
