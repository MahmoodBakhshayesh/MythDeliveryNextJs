"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { driversRepository } from "@/features/drivers/repositories/drivers.repository";
import { driverVehicleAssignmentsRepository } from "@/features/drivers/repositories/driver-vehicle-assignments.repository";
import type {
  AddDriverVehicleAssignmentBody,
  AddDriverBody,
  DriverVehicleAssignmentResponse,
  DriverResponse,
  UpdateDriverBody,
  UpdateDriverVehicleAssignmentBody,
} from "@/features/drivers/domain/driver.types";
import { listDriverVehicleAssignmentsUseCase } from "@/features/drivers/usecases/list-driver-vehicle-assignments.usecase";
import { listDriversUseCase } from "@/features/drivers/usecases/list-drivers.usecase";
import { listVehiclesUseCase } from "@/features/fleet/usecases/list-vehicles.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useDriversPageController() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [preferPersonalVehicle, setPreferPersonalVehicle] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [assignmentDriverId, setAssignmentDriverId] = useState("");
  const [assignmentVehicleId, setAssignmentVehicleId] = useState("");
  const [assignmentFromLocal, setAssignmentFromLocal] = useState("");
  const [assignmentToLocal, setAssignmentToLocal] = useState("");
  const [editAssignmentDialogOpen, setEditAssignmentDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [editingAssignmentFromLocal, setEditingAssignmentFromLocal] = useState("");
  const [editingAssignmentToLocal, setEditingAssignmentToLocal] = useState("");

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
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listVehiclesUseCase(effectiveOrgId),
  });
  const assignmentsQuery = useQuery({
    queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId || "_"),
    enabled: !!effectiveOrgId,
    queryFn: () => listDriverVehicleAssignmentsUseCase(effectiveOrgId),
  });

  useEffect(() => {
    if (!assignmentDriverId && driversQuery.data?.[0]?.id) {
      setAssignmentDriverId(driversQuery.data[0].id);
    }
  }, [assignmentDriverId, driversQuery.data]);

  useEffect(() => {
    if (!assignmentVehicleId && vehiclesQuery.data?.[0]?.id) {
      setAssignmentVehicleId(vehiclesQuery.data[0].id);
    }
  }, [assignmentVehicleId, vehiclesQuery.data]);

  useEffect(() => {
    if (!assignmentFromLocal) {
      setAssignmentFromLocal(toLocalInputValue(new Date().toISOString()));
    }
  }, [assignmentFromLocal]);

  const resetForm = () => {
    setEditing(null);
    setDisplayName("");
    setPhone("");
    setLicenseNumber("");
    setIsActive(true);
    setPreferPersonalVehicle(false);
    setEmail("");
    setUserName("");
    setPassword("");
    setPasswordConfirm("");
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
    setPreferPersonalVehicle(Boolean(d.preferPersonalVehicleForPlanning));
    setEmail("");
    setUserName("");
    setPassword("");
    setPasswordConfirm("");
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
          preferPersonalVehicleForPlanning: preferPersonalVehicle,
        };
        const res = await driversRepository.update(editing.id, body);
        if (!isAppSuccess(res) || !res.body)
          throw new Error(appErrorMessage(res));
        return res.body;
      }
      const mail = email.trim();
      if (!mail) throw new Error("Email is required for the driver login.");
      if (!password || password !== passwordConfirm) {
        throw new Error("Password and confirmation must match and cannot be empty.");
      }
      const body: AddDriverBody = {
        organizationId: effectiveOrgId,
        email: mail,
        userName: userName.trim() || null,
        password,
        passwordConfirm,
        displayName: name,
        phone: phone.trim() || null,
        licenseNumber: licenseNumber.trim() || null,
        preferPersonalVehicleForPlanning: preferPersonalVehicle,
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

  const assignmentAddMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentDriverId || !assignmentVehicleId || !assignmentFromLocal) {
        throw new Error("Driver, vehicle and start date are required.");
      }
      const body: AddDriverVehicleAssignmentBody = {
        driverId: assignmentDriverId,
        vehicleId: assignmentVehicleId,
        effectiveFromUtc: new Date(assignmentFromLocal).toISOString(),
        effectiveToUtc: assignmentToLocal
          ? new Date(assignmentToLocal).toISOString()
          : null,
      };
      const res = await driverVehicleAssignmentsRepository.add(body);
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Driver assigned to vehicle.");
      setAssignmentToLocal("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not assign vehicle."),
  });

  const assignmentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await driverVehicleAssignmentsRepository.delete(id);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success("Assignment removed.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not remove assignment."),
  });

  const assignmentUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!editingAssignmentId || !editingAssignmentFromLocal) {
        throw new Error("Start date is required.");
      }
      const body: UpdateDriverVehicleAssignmentBody = {
        effectiveFromUtc: new Date(editingAssignmentFromLocal).toISOString(),
        effectiveToUtc: editingAssignmentToLocal
          ? new Date(editingAssignmentToLocal).toISOString()
          : null,
      };
      const res = await driverVehicleAssignmentsRepository.update(
        editingAssignmentId,
        body,
      );
      if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
      return res.body;
    },
    onSuccess: async () => {
      toast.success("Assignment updated.");
      setEditAssignmentDialogOpen(false);
      setEditingAssignmentId("");
      setEditingAssignmentFromLocal("");
      setEditingAssignmentToLocal("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverVehicleAssignments(effectiveOrgId),
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not update assignment."),
  });

  const openEditAssignment = (assignment: DriverVehicleAssignmentResponse) => {
    setEditingAssignmentId(assignment.id);
    setEditingAssignmentFromLocal(toLocalInputValue(assignment.effectiveFromUtc));
    setEditingAssignmentToLocal(
      assignment.effectiveToUtc ? toLocalInputValue(assignment.effectiveToUtc) : "",
    );
    setEditAssignmentDialogOpen(true);
  };

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      drivers: driversQuery.data ?? null,
      vehicles: vehiclesQuery.data ?? null,
      assignments: assignmentsQuery.data ?? null,
      orgsLoading: orgsQuery.isLoading,
      driversLoading: driversQuery.isLoading,
      vehiclesLoading: vehiclesQuery.isLoading,
      assignmentsLoading: assignmentsQuery.isLoading,
      dialogOpen,
      editing,
      displayName,
      phone,
      licenseNumber,
      isActive,
      preferPersonalVehicle,
      email,
      userName,
      password,
      passwordConfirm,
      savePending: saveMutation.isPending,
      deletePending: deleteMutation.isPending,
      assignmentDriverId,
      assignmentVehicleId,
      assignmentFromLocal,
      assignmentToLocal,
      assignmentSavePending: assignmentAddMutation.isPending,
      assignmentDeletePending: assignmentDeleteMutation.isPending,
      editAssignmentDialogOpen,
      editingAssignmentFromLocal,
      editingAssignmentToLocal,
      assignmentUpdatePending: assignmentUpdateMutation.isPending,
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
      setPreferPersonalVehicle,
      setEmail,
      setUserName,
      setPassword,
      setPasswordConfirm,
      submit: () => saveMutation.mutate(),
      deleteDriver: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Remove this driver?")
        )
          return;
        deleteMutation.mutate(id);
      },
      setAssignmentDriverId,
      setAssignmentVehicleId,
      setAssignmentFromLocal,
      setAssignmentToLocal,
      assignVehicle: () => assignmentAddMutation.mutate(),
      deleteAssignment: (id: string) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Remove this driver-vehicle assignment?")
        )
          return;
        assignmentDeleteMutation.mutate(id);
      },
      openEditAssignment,
      setEditAssignmentDialogOpen,
      setEditingAssignmentFromLocal,
      setEditingAssignmentToLocal,
      updateAssignment: () => assignmentUpdateMutation.mutate(),
    },
  };
}

export type DriversPageViewModel = ReturnType<typeof useDriversPageController>;
