"use client";

import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import { getFleetShellTier, type FleetShellTier } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export function useFleetShellTier(): FleetShellTier | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const roles = mergeRolesFromJwt(persistedRoles, accessToken);
  return getFleetShellTier(roles);
}
