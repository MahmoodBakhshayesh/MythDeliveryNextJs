"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/lib/use-is-admin";
import { addOrganizationUseCase } from "@/features/organizations/usecases/add-organization.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useOrganizationsListController() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

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
    },
  };
}

export type OrganizationsListViewModel = ReturnType<
  typeof useOrganizationsListController
>;
