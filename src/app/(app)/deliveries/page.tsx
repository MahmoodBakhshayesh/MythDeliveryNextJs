"use client";

import { useDeliveriesPageController } from "@/features/deliveries/controllers/deliveries-page.controller";
import { DeliveriesPageView } from "@/features/deliveries/views/deliveries-page.view";

export default function DeliveriesPage() {
  const vm = useDeliveriesPageController();
  return <DeliveriesPageView {...vm} />;
}
