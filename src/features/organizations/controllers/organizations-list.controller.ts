"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/lib/use-is-admin";
import { addOrganizationUseCase } from "@/features/organizations/usecases/add-organization.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { updateOrganizationUseCase } from "@/features/organizations/usecases/update-organization.usecase";
import { queryKeys } from "@/lib/query-keys";
import type { OrganizationResponse } from "@/types/api";

export function useOrganizationsListController() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editOrgId, setEditOrgId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAllowManualStops, setEditAllowManualStops] = useState(false);
  const [editShowPlanTimeZone, setEditShowPlanTimeZone] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => addOrganizationUseCase(name),
    onSuccess: async () => {
      toast.success("Organization created.");
      setAddOpen(false);
      setNewOrgName("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not create organization."),
  });

  const updateMutation = useMutation({
    mutationFn: (args: {
      id: string;
      name: string;
      description: string | null;
      allowManualDeliveryStops: boolean;
      showPlanWizardTimeZone: boolean;
    }) =>
      updateOrganizationUseCase(args.id, {
        name: args.name,
        description: args.description,
        allowManualDeliveryStops: args.allowManualDeliveryStops,
        showPlanWizardTimeZone: args.showPlanWizardTimeZone,
      }),
    onSuccess: async () => {
      toast.success("Organization updated.");
      setEditOpen(false);
      setEditOrgId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not update organization."),
  });

  function openEdit(org: OrganizationResponse) {
    setEditOrgId(org.id);
    setEditName(org.name);
    setEditDescription(org.description?.trim() ?? "");
    setEditAllowManualStops(Boolean(org.allowManualDeliveryStops));
    setEditShowPlanTimeZone(Boolean(org.showPlanWizardTimeZone));
    setEditOpen(true);
  }

  function submitEdit() {
    const id = editOrgId;
    if (!id) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    const desc = editDescription.trim();
    updateMutation.mutate({
      id,
      name,
      description: desc.length ? desc : null,
      allowManualDeliveryStops: editAllowManualStops,
      showPlanWizardTimeZone: editShowPlanTimeZone,
    });
  }

  return {
    viewState: {
      organizations: query.data ?? null,
      isLoading: query.isLoading,
      errorMessage:
        query.error instanceof Error ? query.error.message : query.error
          ? String(query.error)
          : null,
      isAdmin,
      addOpen,
      newOrgName,
      addPending: addMutation.isPending,
      editOpen,
      editName,
      editDescription,
      editAllowManualStops,
      editShowPlanTimeZone,
      updatePending: updateMutation.isPending,
    },
    actions: {
      setAddOpen,
      setNewOrgName,
      submitAdd: () => {
        const n = newOrgName.trim();
        if (!n) {
          toast.error("Name is required.");
          return;
        }
        addMutation.mutate(n);
      },
      setEditOpen,
      openEdit,
      setEditName,
      setEditDescription,
      setEditAllowManualStops,
      setEditShowPlanTimeZone,
      submitEdit,
    },
  };
}

export type OrganizationsListViewModel = ReturnType<
  typeof useOrganizationsListController
>;
