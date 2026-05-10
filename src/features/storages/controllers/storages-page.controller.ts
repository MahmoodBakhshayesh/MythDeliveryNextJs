"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { listStoragesUseCase } from "@/features/storages/usecases/list-storages.usecase";
import { addStorageUseCase } from "@/features/storages/usecases/add-storage.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useStoragesPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [storageName, setStorageName] = useState("");
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

  const storagesQuery = useQuery({
    queryKey: queryKeys.storages(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listStoragesUseCase(effectiveOrgId),
  });

  const addMutation = useMutation({
    mutationFn: addStorageUseCase,
    onSuccess: async () => {
      toast.success("Storage saved.");
      setDialogOpen(false);
      setStorageName("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.storages(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not save storage."),
  });

  const submitStorage = () => {
    const name = storageName.trim();
    if (!effectiveOrgId || !name) {
      toast.error("Select an organization and enter a name.");
      return;
    }
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error("Enter valid latitude and longitude.");
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
      storages: storagesQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      storagesLoading: storagesQuery.isLoading,
      dialogOpen,
      storageName,
      latitude,
      longitude,
      addPending: addMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setDialogOpen,
      setStorageName,
      setLatitude,
      setLongitude,
      submitStorage,
    },
  };
}

export type StoragesPageViewModel = ReturnType<typeof useStoragesPageController>;
