"use client";

import { PlanningMapView } from "@/features/map/views/planning-map.view";
import { usePlanningMapController } from "@/features/map/controllers/planning-map.controller";

export default function PlanningMapPage() {
  const vm = usePlanningMapController();
  return <PlanningMapView {...vm} />;
}
