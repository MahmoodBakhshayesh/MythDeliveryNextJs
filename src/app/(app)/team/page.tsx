"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeamDirectoryController } from "@/features/team/controllers/team-directory.controller";
import { TeamDirectoryView } from "@/features/team/views/team-directory.view";
import { useIsAdmin } from "@/lib/use-is-admin";

export default function TeamPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { loading, error, data } = useTeamDirectoryController();

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return <TeamDirectoryView loading={loading} error={error} data={data} />;
}
