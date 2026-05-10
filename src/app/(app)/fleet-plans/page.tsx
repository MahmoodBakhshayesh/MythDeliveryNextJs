"use client";

import { useFleetPlansPageController } from "@/features/fleet-plans/controllers/fleet-plans-page.controller";
import { FleetPlansPageView } from "@/features/fleet-plans/views/fleet-plans-page.view";

export default function FleetPlansPage() {
  const vm = useFleetPlansPageController();
  return <FleetPlansPageView {...vm} />;
}
