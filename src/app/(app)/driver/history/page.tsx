"use client";

import { useDriverPortalHistoryController } from "@/features/driver-portal/controllers/driver-portal-history.controller";
import { DriverPortalHistoryView } from "@/features/driver-portal/views/driver-portal-history.view";

export default function DriverHistoryPage() {
  const vm = useDriverPortalHistoryController();
  return <DriverPortalHistoryView {...vm} />;
}
