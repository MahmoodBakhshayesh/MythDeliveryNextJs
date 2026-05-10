"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type {
  PersonalVehicleDto,
  UpdatePersonalVehicleBody,
} from "@/features/driver-portal/domain/driver-portal.types";
import { driverPortalRepository } from "@/features/driver-portal/repositories/driver-portal.repository";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export function useDriverPortalVehiclesController() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalVehicleDto | null>(null);
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [isActive, setIsActive] = useState(true);

  const listQuery = useQuery({
    queryKey: queryKeys.driverPortalPersonalVehicles,
    queryFn: async () => {
      const res = await driverPortalRepository.listPersonalVehicles();
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
  });

  const resetForm = () => {
    setEditing(null);
    setName("");
    setPlateNumber("");
    setVin("");
    setVehicleType("");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (v: PersonalVehicleDto) => {
    setEditing(v);
    setName(v.name);
    setPlateNumber(v.plateNumber ?? "");
    setVin(v.vin ?? "");
    setVehicleType(v.vehicleType ?? "");
    setIsActive(v.isActive);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n) throw new Error("Vehicle name is required.");
      if (editing) {
        const body: UpdatePersonalVehicleBody = {
          name: n,
          plateNumber: plateNumber.trim() || null,
          vin: vin.trim() || null,
          vehicleType: vehicleType.trim() || null,
          isActive,
        };
        const res = await driverPortalRepository.updatePersonalVehicle(
          editing.id,
          body,
        );
        if (!isAppSuccess(res) || !res.body)
          throw new Error(appErrorMessage(res));
        return res.body;
      }
      const res = await driverPortalRepository.addPersonalVehicle({
        name: n,
        plateNumber: plateNumber.trim() || null,
        vin: vin.trim() || null,
        vehicleType: vehicleType.trim() || null,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success(editing ? "Vehicle updated." : "Vehicle added.");
      setDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverPortalPersonalVehicles,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await driverPortalRepository.deletePersonalVehicle(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success("Vehicle removed.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverPortalPersonalVehicles,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete."),
  });

  return {
    viewState: {
      vehicles: listQuery.data ?? null,
      loading: listQuery.isLoading,
      dialogOpen,
      editing,
      name,
      plateNumber,
      vin,
      vehicleType,
      isActive,
      savePending: saveMutation.isPending,
      deletePending: deleteMutation.isPending,
    },
    actions: {
      openCreate,
      openEdit,
      setDialogOpen,
      closeDialog: () => {
        setDialogOpen(false);
        resetForm();
      },
      setName,
      setPlateNumber,
      setVin,
      setVehicleType,
      setIsActive,
      submit: () => saveMutation.mutate(),
      deleteVehicle: (id: string) => {
        if (typeof window !== "undefined" && !window.confirm("Remove this vehicle?"))
          return;
        deleteMutation.mutate(id);
      },
    },
  };
}

export type DriverPortalVehiclesViewModel = ReturnType<
  typeof useDriverPortalVehiclesController
>;
