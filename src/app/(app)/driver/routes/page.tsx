"use client";

import { useDriverPortalRoutesController } from "@/features/driver-portal/controllers/driver-portal-routes.controller";
import { DriverPortalRoutesView } from "@/features/driver-portal/views/driver-portal-routes.view";

export default function DriverRoutesPage() {
  const vm = useDriverPortalRoutesController();
  return <DriverPortalRoutesView {...vm} />;
}
