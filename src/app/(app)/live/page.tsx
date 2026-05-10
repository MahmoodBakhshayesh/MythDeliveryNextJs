"use client";

import { useLivePageController } from "@/features/realtime/controllers/live-page.controller";
import { LivePageView } from "@/features/realtime/views/live-page.view";

export default function LivePage() {
  const vm = useLivePageController();
  return <LivePageView {...vm} />;
}
