"use client";

import { usePlanWorkflowController } from "@/features/plan-workflow/controllers/plan-workflow.controller";
import { PlanWorkflowView } from "@/features/plan-workflow/views/plan-workflow.view";

export default function PlanWorkflowPage() {
  const vm = usePlanWorkflowController();
  return <PlanWorkflowView {...vm} />;
}
