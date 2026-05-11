"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listDistributionCentersUseCase } from "@/features/distribution-centers/usecases/list-distribution-centers.usecase";
import { addDistributionCenterUseCase } from "@/features/distribution-centers/usecases/add-distribution-center.usecase";
import { updateDistributionCenterUseCase } from "@/features/distribution-centers/usecases/update-distribution-center.usecase";
import { queryKeys } from "@/lib/query-keys";
import { useFleetShellTier } from "@/lib/use-fleet-shell-tier";
import type { DistributionCenterDto } from "@/features/distribution-centers/domain/distribution-center.types";

export function useDistributionCentersPageController() {
  const queryClient = useQueryClient();
  const fleetTier = useFleetShellTier();
  const isDcManagerOnly = fleetTier === "manager";

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [centerName, setCenterName] = useState("");
  const [latitude, setLatitude] = useState("35.6892");
  const [longitude, setLongitude] = useState("51.3890");

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

  const resetFormFields = () => {
    setCenterName("");
    setLatitude("35.6892");
    setLongitude("51.3890");
    setEditingCenterId(null);
    setDialogMode("add");
  };

  const addMutation = useMutation({
    mutationFn: addDistributionCenterUseCase,
    onSuccess: async () => {
      toast.success("Distribution center saved.");
      setDialogOpen(false);
      resetFormFields();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.distributionCenters(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not save distribution center."),
  });

  const updateMutation = useMutation({
    mutationFn: (args: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }) =>
      updateDistributionCenterUseCase(args.id, {
        name: args.name,
        latitude: args.latitude,
        longitude: args.longitude,
      }),
    onSuccess: async () => {
      toast.success("Distribution center updated.");
      setDialogOpen(false);
      resetFormFields();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.distributionCenters(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not update distribution center."),
  });

  const openAddDialog = () => {
    resetFormFields();
    setDialogMode("add");
    setDialogOpen(true);
  };

  const openEditDialog = (c: DistributionCenterDto) => {
    setDialogMode("edit");
    setEditingCenterId(c.id);
    setCenterName(c.name);
    setLatitude(String(c.latitude));
    setLongitude(String(c.longitude));
    setDialogOpen(true);
  };

  const submitDistributionCenter = () => {
    const name = centerName.trim();
    if (!name) {
      toast.error("Enter a name.");
      return;
    }
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error("Enter valid latitude and longitude.");
      return;
    }
    if (dialogMode === "edit" && editingCenterId) {
      updateMutation.mutate({
        id: editingCenterId,
        name,
        latitude: lat,
        longitude: lng,
      });
      return;
    }
    if (!effectiveOrgId) {
      toast.error("Select an organization.");
      return;
    }
    addMutation.mutate({
      organizationId: effectiveOrgId,
      name,
      latitude: lat,
      longitude: lng,
    });
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      distributionCenters: distributionCentersQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      distributionCentersLoading: distributionCentersQuery.isLoading,
      dialogOpen,
      dialogMode,
      isDcManagerOnly,
      centerName,
      latitude,
      longitude,
      savePending: addMutation.isPending || updateMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      handleDialogOpenChange: (open: boolean) => {
        setDialogOpen(open);
        if (!open) resetFormFields();
      },
      openAddDialog,
      openEditDialog,
      setCenterName,
      setLatitude,
      setLongitude,
      submitDistributionCenter,
    },
  };
}

export type DistributionCentersPageViewModel = ReturnType<
  typeof useDistributionCentersPageController
>;
