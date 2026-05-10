"use client";

import { usePlanningPageController } from "@/features/planning/controllers/planning-page.controller";
import { PlanningPageView } from "@/features/planning/views/planning-page.view";

export default function PlanningPage() {
  const vm = usePlanningPageController();
  return <PlanningPageView {...vm} />;
}
