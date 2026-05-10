"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLoginController } from "@/features/auth/controllers/login.controller";
import { LoginFormView } from "@/features/auth/views/login-form.view";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthStoreHydrated } from "@/hooks/use-auth-store-hydrated";

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const storeHydrated = useAuthStoreHydrated();
  const loginVm = useLoginController();

  useEffect(() => {
    if (!storeHydrated) return;
    if (token) router.replace("/dashboard");
  }, [storeHydrated, token, router]);

  if (token) return null;

  return <LoginFormView {...loginVm} />;
}
