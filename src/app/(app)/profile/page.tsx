"use client";

import { useProfilePageController } from "@/features/profile/controllers/profile-page.controller";
import { ProfilePageView } from "@/features/profile/views/profile-page.view";

export default function ProfilePage() {
  const vm = useProfilePageController();
  return <ProfilePageView {...vm} />;
}
