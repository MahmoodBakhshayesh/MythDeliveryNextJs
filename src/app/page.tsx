"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { mergeRolesFromJwt } from "@/lib/jwt-roles";
import { getPostLoginRoute } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthStoreHydrated } from "@/hooks/use-auth-store-hydrated";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const persistedRoles = useAuthStore((s) => s.roles);
  const storeHydrated = useAuthStoreHydrated();
  const t = useTranslations("Common");

  useEffect(() => {
    if (!storeHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    const roles = mergeRolesFromJwt(persistedRoles, token);
    router.replace(getPostLoginRoute(roles));
  }, [storeHydrated, token, persistedRoles, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <LocaleSwitcher />
      <div className="text-muted-foreground text-sm">{t("redirecting")}</div>
    </div>
  );
}
