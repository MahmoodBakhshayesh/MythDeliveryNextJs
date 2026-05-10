"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addVehicleUseCase } from "@/features/fleet/usecases/add-vehicle.usecase";
import {
  CUSTOM_VEHICLE_TYPE_KEY,
  getPresetByKey,
  validateVehicleCapacities,
  VEHICLE_TYPE_PRESETS,
} from "@/features/fleet/domain/vehicle-type-presets";
import { listVehiclesUseCase } from "@/features/fleet/usecases/list-vehicles.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useFleetPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleTypePresetKey, setVehicleTypePresetKey] = useState(
    VEHICLE_TYPE_PRESETS[0]?.key ?? CUSTOM_VEHICLE_TYPE_KEY,
  );
  const [vehicleType, setVehicleType] = useState("");
  const [maxWeightKg, setMaxWeightKg] = useState("3500");
  const [maxVolumeM3, setMaxVolumeM3] = useState("15");
  const [maxStopsPerRoute, setMaxStopsPerRoute] = useState("40");

  useEffect(() => {
    const preset = getPresetByKey(vehicleTypePresetKey);
    if (!preset) return;
    setVehicleType(preset.vehicleType);
    setMaxWeightKg(String(preset.maxWeightKg));
    setMaxVolumeM3(String(preset.maxVolumeM3));
    setMaxStopsPerRoute(String(preset.maxStopsPerRoute));
  }, [vehicleTypePresetKey]);

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
      setVehicleTypePresetKey(VEHICLE_TYPE_PRESETS[0]?.key ?? CUSTOM_VEHICLE_TYPE_KEY);
      setVehicleType("");
      setMaxWeightKg("3500");
      setMaxVolumeM3("15");
      setMaxStopsPerRoute("40");
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
    const parsedMaxWeightKg = Number.parseFloat(maxWeightKg);
    const parsedMaxVolumeM3 = Number.parseFloat(maxVolumeM3);
    const parsedMaxStopsPerRoute = Number.parseInt(maxStopsPerRoute, 10);
    if (!Number.isFinite(parsedMaxWeightKg) || parsedMaxWeightKg <= 0) {
      toast.error("Enter a valid max weight.");
      return;
    }
    if (!Number.isFinite(parsedMaxVolumeM3) || parsedMaxVolumeM3 <= 0) {
      toast.error("Enter a valid max volume.");
      return;
    }
    if (!Number.isFinite(parsedMaxStopsPerRoute) || parsedMaxStopsPerRoute <= 0) {
      toast.error("Enter a valid max stops.");
      return;
    }
    const capacityValidationError = validateVehicleCapacities(
      vehicleTypePresetKey,
      {
        maxWeightKg: parsedMaxWeightKg,
        maxVolumeM3: parsedMaxVolumeM3,
        maxStopsPerRoute: parsedMaxStopsPerRoute,
      },
    );
    if (capacityValidationError) {
      toast.error(capacityValidationError);
      return;
    }
    addVehicleMutation.mutate({
      organizationId: effectiveOrgId,
      name,
      plateNumber: plateNumber.trim() || null,
      vehicleType: vehicleType.trim() || null,
      maxWeightKg: parsedMaxWeightKg,
      maxVolumeM3: parsedMaxVolumeM3,
      maxStopsPerRoute: parsedMaxStopsPerRoute,
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
      vehicleDialogOpen,
      vehicleName,
      plateNumber,
      vehicleTypePresetKey,
      vehicleTypePresets: VEHICLE_TYPE_PRESETS,
      isCustomVehicleType: vehicleTypePresetKey === CUSTOM_VEHICLE_TYPE_KEY,
      vehicleType,
      maxWeightKg,
      maxVolumeM3,
      maxStopsPerRoute,
      addVehiclePending: addVehicleMutation.isPending,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
      setVehicleDialogOpen,
      setVehicleName,
      setPlateNumber,
      setVehicleTypePresetKey,
      setVehicleType,
      setMaxWeightKg,
      setMaxVolumeM3,
      setMaxStopsPerRoute,
      submitVehicle,
    },
  };
}

export type FleetPageViewModel = ReturnType<typeof useFleetPageController>;
