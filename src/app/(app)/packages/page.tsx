"use client";

import { usePackagesPageController } from "@/features/packages/controllers/packages-page.controller";
import { PackagesPageView } from "@/features/packages/views/packages-page.view";

export default function PackagesPage() {
  const vm = usePackagesPageController();
  return <PackagesPageView {...vm} />;
}
