"use client";

import { DriverPortalProfileView } from "@/features/driver-portal/views/driver-portal-profile.view";
import { useDriverPortalProfileController } from "@/features/driver-portal/controllers/driver-portal-profile.controller";

export default function DriverPortalProfilePage() {
  const vm = useDriverPortalProfileController();
  return <DriverPortalProfileView {...vm} />;
}
