"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useManagersPageController } from "@/features/managers/controllers/managers-page.controller";
import { ManagersPageView } from "@/features/managers/views/managers-page.view";
import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import { canProvisionManagers } from "@/lib/roles";
import { useFleetShellTier } from "@/lib/use-fleet-shell-tier";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useAuthStore } from "@/stores/auth-store";

export default function ManagersPage() {
  const router = useRouter();
  const tier = useFleetShellTier();
  const isAdmin = useIsAdmin();
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const roles = useMemo(
    () => mergeRolesFromJwt(persistedRoles, accessToken),
    [persistedRoles, accessToken],
  );
  const allowed = isAdmin || canProvisionManagers(roles);
  const vm = useManagersPageController();

  useEffect(() => {
    if (tier === "manager") router.replace("/drivers");
    else if (!allowed) router.replace("/dashboard");
  }, [tier, router, allowed]);

  if (tier === "manager" || !allowed) return null;

  return <ManagersPageView {...vm} />;
}
