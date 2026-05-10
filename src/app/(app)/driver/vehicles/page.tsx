"use client";

import { DriverPortalVehiclesView } from "@/features/driver-portal/views/driver-portal-vehicles.view";
import { useDriverPortalVehiclesController } from "@/features/driver-portal/controllers/driver-portal-vehicles.controller";

export default function DriverPortalVehiclesPage() {
  const vm = useDriverPortalVehiclesController();
  return <DriverPortalVehiclesView {...vm} />;
}
