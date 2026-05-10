"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/lib/use-is-admin";
import { addVehicleUseCase } from "@/features/fleet/usecases/add-vehicle.usecase";
import { listVehiclesUseCase } from "@/features/fleet/usecases/list-vehicles.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useFleetPageController() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");

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

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listVehiclesUseCase(effectiveOrgId),
  });

  const addVehicleMutation = useMutation({
    mutationFn: addVehicleUseCase,
    onSuccess: async () => {
      toast.success("Vehicle added.");
      setVehicleDialogOpen(false);
      setVehicleName("");
      setPlateNumber("");
      setVehicleType("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not add vehicle."),
  });

  const submitVehicle = () => {
    const name = vehicleName.trim();
    if (!effectiveOrgId || !name) {
      toast.error("Select an organization and enter a vehicle name.");
      return;
    }
    addVehicleMutation.mutate({
      organizationId: effectiveOrgId,
      name,
      plateNumber: plateNumber.trim() || null,
      vehicleType: vehicleType.trim() || null,
      maxWeightKg: 3500,
      maxVolumeM3: 15,
      maxStopsPerRoute: 40,
      isActive: true,
    });
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      vehicles: vehiclesQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      vehiclesLoading: vehiclesQuery.isLoading,
      isAdmin,
      vehicleDialogOpen,
      vehicleName,
      plateNumber,
      vehicleType,
      addVehiclePending: addVehicleMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setVehicleDialogOpen,
      setVehicleName,
      setPlateNumber,
      setVehicleType,
      submitVehicle,
    },
  };
}

export type FleetPageViewModel = ReturnType<typeof useFleetPageController>;
