"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutUseCase } from "@/features/auth/usecases/logout.usecase";
import { useAuthStore } from "@/stores/auth-store";

/** Shell / layout: logout action via use case only (no repository import). */
export function useLogoutController() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  async function logout() {
    await logoutUseCase();
    clearSession();
    toast.message("Signed out");
    router.replace("/login");
  }

  return { logout };
}
