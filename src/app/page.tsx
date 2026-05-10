"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthStoreHydrated } from "@/hooks/use-auth-store-hydrated";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const storeHydrated = useAuthStoreHydrated();
  const t = useTranslations("Common");

  useEffect(() => {
    if (!storeHydrated) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [storeHydrated, token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <LocaleSwitcher />
      <div className="text-muted-foreground text-sm">{t("redirecting")}</div>
    </div>
  );
}
