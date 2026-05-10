"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) router.replace("/login");
  }, [mounted, token, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!token) return null;

  return <>{children}</>;
}
