"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { changePasswordUseCase } from "@/features/profile/usecases/change-password.usecase";
import { clearAvatarUseCase } from "@/features/profile/usecases/clear-avatar.usecase";
import { getProfileUseCase } from "@/features/profile/usecases/get-profile.usecase";
import { updateProfileUseCase } from "@/features/profile/usecases/update-profile.usecase";
import { uploadAvatarUseCase } from "@/features/profile/usecases/upload-avatar.usecase";
import { queryKeys } from "@/lib/query-keys";

export function useProfilePageController() {
  const qc = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => getProfileUseCase(),
  });

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [cur, setCur] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const me = profileQuery.data;

  useEffect(() => {
    if (!me) return;
    setDisplayName(me.displayName ?? "");
    setPhone(me.phoneNumber ?? "");
    setBio(me.bio ?? "");
  }, [me]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateProfileUseCase({
        displayName: displayName || undefined,
        phoneNumber: phone || undefined,
        bio: bio || undefined,
      }),
    onSuccess: async () => {
      toast.success("Profile updated");
      await qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const password = useMutation({
    mutationFn: () =>
      changePasswordUseCase({
        currentPassword: cur,
        newPassword: pw1,
        confirmNewPassword: pw2,
      }),
    onSuccess: () => {
      toast.success("Password updated");
      setCur("");
      setPw1("");
      setPw2("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => uploadAvatarUseCase(file),
    onSuccess: async () => {
      toast.success("Avatar updated");
      await qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearAvatar = useMutation({
    mutationFn: () => clearAvatarUseCase(),
    onSuccess: async () => {
      toast.message("Avatar removed");
      await qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    viewState: {
      profile: me ?? null,
      isLoading: profileQuery.isLoading,
      displayName,
      phone,
      bio,
      passwordCurrent: cur,
      passwordNew: pw1,
      passwordConfirm: pw2,
    },
    actions: {
      setDisplayName,
      setPhone,
      setBio,
      setPasswordCurrent: setCur,
      setPasswordNew: setPw1,
      setPasswordConfirm: setPw2,
      saveProfile: () => saveProfile.mutate(),
      changePassword: () => password.mutate(),
      uploadAvatarFile: (file: File) => uploadAvatar.mutate(file),
      clearAvatar: () => clearAvatar.mutate(),
    },
    pending: {
      saveProfile: saveProfile.isPending,
      password: password.isPending,
      uploadAvatar: uploadAvatar.isPending,
      clearAvatar: clearAvatar.isPending,
    },
  };
}

export type ProfilePageViewModel = ReturnType<typeof useProfilePageController>;
