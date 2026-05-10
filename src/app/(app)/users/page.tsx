"use client";

import { UsersPageView } from "@/features/users/views/users-page.view";
import { useUsersPageController } from "@/features/users/controllers/users-page.controller";

export default function UsersPage() {
  const vm = useUsersPageController();
  return <UsersPageView {...vm} />;
}
