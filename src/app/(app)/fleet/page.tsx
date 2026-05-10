"use client";

import { useFleetPageController } from "@/features/fleet/controllers/fleet-page.controller";
import { FleetPageView } from "@/features/fleet/views/fleet-page.view";

export default function FleetPage() {
  const vm = useFleetPageController();
  return <FleetPageView {...vm} />;
}
