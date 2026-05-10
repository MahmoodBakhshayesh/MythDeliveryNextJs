"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    router.replace(token ? "/dashboard" : "/login");
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <div className="text-muted-foreground text-sm">Redirecting…</div>
    </div>
  );
}
