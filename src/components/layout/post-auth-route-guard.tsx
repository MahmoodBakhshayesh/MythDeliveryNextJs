"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import {
  canDriverSelfService,
  isDriverOnlyAccount,
  isDriverPortalPath,
} from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useIsAdmin } from "@/lib/use-is-admin";

/**
 * Pure drivers only use /driver/*. Admins cannot open driver portal (API forbids).
 */
export function PostAuthRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const roles = mergeRolesFromJwt(persistedRoles, accessToken);
  const driverPortal = canDriverSelfService(roles);
  const pureDriver = isDriverOnlyAccount(roles);
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!accessToken) return;

    if (isAdmin && isDriverPortalPath(pathname)) {
      router.replace("/dashboard");
      return;
    }

    if (pureDriver && driverPortal) {
      const allowed =
        isDriverPortalPath(pathname) ||
        pathname === "/login" ||
        pathname === "/";
      if (!allowed) {
        router.replace("/driver");
      }
    }
  }, [accessToken, pathname, pureDriver, driverPortal, router, isAdmin]);

  return <>{children}</>;
}
