"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLoginController } from "@/features/auth/controllers/login.controller";
import { LoginFormView } from "@/features/auth/views/login-form.view";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const loginVm = useLoginController();

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  if (token) return null;

  return <LoginFormView {...loginVm} />;
}
