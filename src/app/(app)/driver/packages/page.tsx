"use client";

import { useDriverPortalPackagesController } from "@/features/driver-portal/controllers/driver-portal-packages.controller";
import { DriverPortalPackagesView } from "@/features/driver-portal/views/driver-portal-packages.view";

export default function DriverPackagesPage() {
  const vm = useDriverPortalPackagesController();
  return <DriverPortalPackagesView {...vm} />;
}
