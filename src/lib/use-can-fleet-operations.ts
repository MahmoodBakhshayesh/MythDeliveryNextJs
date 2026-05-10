"use client";

import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import { canFleetOperations } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export function useCanFleetOperations(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const roles = mergeRolesFromJwt(persistedRoles, accessToken);
  return canFleetOperations(roles);
}
