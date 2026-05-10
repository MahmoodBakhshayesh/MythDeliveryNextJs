"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { driversRepository } from "@/features/drivers/repositories/drivers.repository";
import type {
  AddDriverBody,
  DriverResponse,
  UpdateDriverBody,
} from "@/features/drivers/domain/driver.types";
import { listDriversUseCase } from "@/features/drivers/usecases/list-drivers.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export function useDriversPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  const driversQuery = useQuery({
    queryKey: queryKeys.drivers(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDriversUseCase(effectiveOrgId),
  });

  const resetForm = () => {
    setEditing(null);
    setDisplayName("");
    setPhone("");
    setLicenseNumber("");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (d: DriverResponse) => {
    setEditing(d);
    setDisplayName(d.displayName);
    setPhone(d.phone ?? "");
    setLicenseNumber(d.licenseNumber ?? "");
    setIsActive(d.isActive);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = displayName.trim();
      if (!effectiveOrgId || !name) {
        throw new Error("Organization and display name are required.");
      }
      if (editing) {
        const body: UpdateDriverBody = {
          displayName: name,
          phone: phone.trim() || null,
          licenseNumber: licenseNumber.trim() || null,
          isActive,
        };
        const res = await driversRepository.update(editing.id, body);
        if (!isAppSuccess(res) || !res.body)
          throw new Error(appErrorMessage(res));
        return res.body;
      }
      const body: AddDriverBody = {
        organizationId: effectiveOrgId,
        displayName: name,
        phone: phone.trim() || null,
        licenseNumber: licenseNumber.trim() || null,
        isActive,
      };
      const res = await driversRepository.add(body);
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success(editing ? "Driver updated." : "Driver added.");
      setDialogOpen(false);
      resetForm();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not save driver."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await driversRepository.delete(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success("Driver removed.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(effectiveOrgId),
      });
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete driver."),
  });

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      drivers: driversQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      driversLoading: driversQuery.isLoading,
      dialogOpen,
      editing,
      displayName,
      phone,
      licenseNumber,
      isActive,
      savePending: saveMutation.isPending,
      deletePending: deleteMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      openCreate,
      openEdit,
      setDialogOpen,
      setDisplayName,
      setPhone,
      setLicenseNumber,
      setIsActive,
      submit: () => saveMutation.mutate(),
      deleteDriver: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Remove this driver?")
        )
          return;
        deleteMutation.mutate(id);
      },
    },
  };
}

export type DriversPageViewModel = ReturnType<typeof useDriversPageController>;
