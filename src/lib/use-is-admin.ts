"use client";

import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import { useAuthStore } from "@/stores/auth-store";

/** Seeded dev admin from IdentitySeeders (username / email). */
function isSeededAdminAccount(
  username: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (username?.trim().toLowerCase() === "admin") return true;
  if (email?.trim().toLowerCase() === "admin@admin.com") return true;
  return false;
}

/** Admin UI gate — JWT roles + persisted roles + seeded admin account fallback. */
export function useIsAdmin(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const username = useAuthStore((s) => s.username);
  const email = useAuthStore((s) => s.email);

  if (isSeededAdminAccount(username, email)) return true;

  const roles = mergeRolesFromJwt(persistedRoles, accessToken);
  return roles.some((r) => /^admin$/i.test(String(r).trim()));
}
