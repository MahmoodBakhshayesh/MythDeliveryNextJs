"use client";

import { useDistributionCentersPageController } from "@/features/distribution-centers/controllers/distribution-centers-page.controller";
import { DistributionCentersPageView } from "@/features/distribution-centers/views/distribution-centers-page.view";

export default function DistributionCentersPage() {
  const vm = useDistributionCentersPageController();
  return <DistributionCentersPageView {...vm} />;
}
