"use client";

import { useStoragesPageController } from "@/features/storages/controllers/storages-page.controller";
import { StoragesPageView } from "@/features/storages/views/storages-page.view";

export default function StoragesPage() {
  const vm = useStoragesPageController();
  return <StoragesPageView {...vm} />;
}
