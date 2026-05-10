"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/lib/use-is-admin";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Skeleton className="h-40 w-full max-w-lg" />
      </div>
    );
  }

  return <>{children}</>;
}
