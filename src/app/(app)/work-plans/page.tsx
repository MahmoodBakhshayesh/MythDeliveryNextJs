"use client";

import { WorkPlansPageView } from "@/features/work-plans/views/work-plans-page.view";
import { useWorkPlansPageController } from "@/features/work-plans/controllers/work-plans-page.controller";

export default function WorkPlansPage() {
  const vm = useWorkPlansPageController();
  return <WorkPlansPageView {...vm} />;
}
