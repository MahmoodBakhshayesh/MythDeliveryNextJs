"use client";

import { useOrganizationsListController } from "@/features/organizations/controllers/organizations-list.controller";
import { OrganizationsListView } from "@/features/organizations/views/organizations-list.view";

export default function OrganizationsPage() {
  const vm = useOrganizationsListController();
  return <OrganizationsListView {...vm} />;
}
