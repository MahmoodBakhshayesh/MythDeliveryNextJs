"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DriverPortalProfileResponse } from "@/features/driver-portal/domain/driver-portal.types";
import { driverPortalRepository } from "@/features/driver-portal/repositories/driver-portal.repository";
import { queryKeys } from "@/lib/query-keys";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

function normalizeProfile(
  p: DriverPortalProfileResponse,
): DriverPortalProfileResponse {
  const d = p.driver;
  return {
    ...p,
    driver: {
      ...d,
      appUserId: d.appUserId ?? "",
      preferPersonalVehicleForPlanning: Boolean(
        d.preferPersonalVehicleForPlanning,
      ),
    },
  };
}

export function useDriverPortalProfileController() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [preferPersonal, setPreferPersonal] = useState(false);

  const profileQuery = useQuery({
    queryKey: queryKeys.driverPortalProfile,
    queryFn: async () => {
      const res = await driverPortalRepository.getProfile();
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return normalizeProfile(res.body);
    },
  });

  const fleetQuery = useQuery({
    queryKey: queryKeys.driverPortalFleetAssignments,
    queryFn: async () => {
      const res = await driverPortalRepository.listFleetAssignments();
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return res.body;
    },
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setDisplayName(p.driver.displayName);
    setPhone(p.driver.phone ?? "");
    setLicenseNumber(p.driver.licenseNumber ?? "");
    setPreferPersonal(Boolean(p.driver.preferPersonalVehicleForPlanning));
  }, [profileQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const name = displayName.trim();
      if (!name) throw new Error("Display name is required.");
      const res = await driverPortalRepository.updateProfile({
        displayName: name,
        phone: phone.trim() || null,
        licenseNumber: licenseNumber.trim() || null,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return normalizeProfile(res.body);
    },
    onSuccess: async () => {
      toast.success("Profile saved.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverPortalProfile,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save."),
  });

  const preferenceMutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await driverPortalRepository.updatePlanningPreference({
        preferPersonalVehicleForPlanning: next,
      });
      if (!isAppSuccess(res) || !res.body)
        throw new Error(appErrorMessage(res));
      return normalizeProfile(res.body);
    },
    onSuccess: async (_, next) => {
      toast.success(
        next
          ? "Planning will prefer your personal vehicle when active."
          : "Planning will use supervisor-assigned fleet vehicles.",
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverPortalProfile,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update preference."),
  });

  return {
    viewState: {
      profile: profileQuery.data ?? null,
      fleetAssignments: fleetQuery.data ?? null,
      loading: profileQuery.isLoading || fleetQuery.isLoading,
      error: profileQuery.error ?? fleetQuery.error,
      displayName,
      phone,
      licenseNumber,
      preferPersonal,
      savePending: saveProfileMutation.isPending,
      preferencePending: preferenceMutation.isPending,
    },
    actions: {
      setDisplayName,
      setPhone,
      setLicenseNumber,
      saveProfile: () => saveProfileMutation.mutate(),
      setPreferPersonal: (v: boolean) => preferenceMutation.mutate(v),
    },
  };
}

export type DriverPortalProfileViewModel = ReturnType<
  typeof useDriverPortalProfileController
>;
