"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listDistributionCentersUseCase } from "@/features/distribution-centers/usecases/list-distribution-centers.usecase";
import { listManagersUseCase } from "@/features/managers/usecases/list-managers.usecase";
import { addManagerUseCase } from "@/features/managers/usecases/add-manager.usecase";
import { deleteManagerUseCase } from "@/features/managers/usecases/delete-manager.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useManagersPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [distributionCenterId, setDistributionCenterId] = useState("");

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    if (!selectedOrgId && firstOrgId) setSelectedOrgId(firstOrgId);
  }, [firstOrgId, selectedOrgId]);

  const effectiveOrgId = selectedOrgId || firstOrgId || "";

  const distributionCentersQuery = useQuery({
    queryKey: queryKeys.distributionCenters(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDistributionCentersUseCase(effectiveOrgId),
  });

  const managersQuery = useQuery({
    queryKey: queryKeys.managers(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listManagersUseCase(effectiveOrgId),
  });

  useEffect(() => {
    setDistributionCenterId("");
  }, [effectiveOrgId]);

  useEffect(() => {
    const list = distributionCentersQuery.data;
    if (!list?.length) return;
    setDistributionCenterId((prev) =>
      prev && list.some((c) => c.id === prev) ? prev : list[0]!.id,
    );
  }, [distributionCentersQuery.data]);

  const addMutation = useMutation({
    mutationFn: addManagerUseCase,
    onSuccess: async () => {
      toast.success("Manager created.");
      setDialogOpen(false);
      setEmail("");
      setUserName("");
      setDisplayName("");
      setPhone("");
      setPassword("");
      setPasswordConfirm("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.managers(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not create manager."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManagerUseCase,
    onSuccess: async () => {
      toast.success("Manager removed.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.managers(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not remove manager."),
  });

  const submitManager = () => {
    const em = email.trim();
    if (!effectiveOrgId || !em) {
      toast.error("Select an organization and enter an email.");
      return;
    }
    if (!distributionCenterId) {
      toast.error("Add a distribution center before creating a manager.");
      return;
    }
    if (!password || password !== passwordConfirm) {
      toast.error("Password and confirmation must match.");
      return;
    }
    addMutation.mutate({
      organizationId: effectiveOrgId,
      distributionCenterId,
      email: em,
      userName: userName.trim() || null,
      displayName: displayName.trim() || null,
      phone: phone.trim() || null,
      password,
      passwordConfirm,
    });
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      distributionCenters: distributionCentersQuery.data ?? null,
      managers: managersQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      distributionCentersLoading: distributionCentersQuery.isLoading,
      managersLoading: managersQuery.isLoading,
      dialogOpen,
      email,
      userName,
      displayName,
      phone,
      password,
      passwordConfirm,
      distributionCenterId,
      addPending: addMutation.isPending,
      deletePending: deleteMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setDialogOpen,
      setEmail,
      setUserName,
      setDisplayName,
      setPhone,
      setPassword,
      setPasswordConfirm,
      setDistributionCenterId,
      submitManager,
      deleteManager: (id: string) => deleteMutation.mutate(id),
    },
  };
}

export type ManagersPageViewModel = ReturnType<typeof useManagersPageController>;
