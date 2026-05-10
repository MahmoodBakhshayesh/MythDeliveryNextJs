"use client";

import { useDriversPageController } from "@/features/drivers/controllers/drivers-page.controller";
import { DriversPageView } from "@/features/drivers/views/drivers-page.view";

export default function DriversPage() {
  const vm = useDriversPageController();
  return <DriversPageView {...vm} />;
}
