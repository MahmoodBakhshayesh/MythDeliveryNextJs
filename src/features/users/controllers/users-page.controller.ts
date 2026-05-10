"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/lib/use-is-admin";
import { adminUpdateUserUseCase } from "@/features/users/usecases/admin-update-user.usecase";
import { addUserUseCase } from "@/features/users/usecases/add-user.usecase";
import { listRolesUseCase } from "@/features/users/usecases/list-roles.usecase";
import { listUsersUseCase } from "@/features/users/usecases/list-users.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import type {
  AddUserBody,
  AdminUpdateUserBody,
} from "@/features/users/repositories/users.repository";
import { queryKeys } from "@/lib/query-keys";
import type { UserDirectoryEntry } from "@/types/api";

export function useUsersPageController() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [addOrganizationIds, setAddOrganizationIds] = useState<string[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserIsAdmin, setEditUserIsAdmin] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editLocked, setEditLocked] = useState(false);
  const [editOrganizationIds, setEditOrganizationIds] = useState<string[]>([]);

  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => listUsersUseCase(),
    enabled: isAdmin,
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => listRolesUseCase(),
    enabled: isAdmin,
  });

  const organizationsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
    enabled: isAdmin,
  });

  const selectedRoleIsAdmin = useMemo(() => {
    const r = rolesQuery.data?.find((x) => String(x.id) === roleId);
    return r?.name?.trim().toLowerCase() === "admin";
  }, [rolesQuery.data, roleId]);

  useEffect(() => {
    if (selectedRoleIsAdmin) setAddOrganizationIds([]);
  }, [selectedRoleIsAdmin]);

  const addMutation = useMutation({
    mutationFn: addUserUseCase,
    onSuccess: async () => {
      toast.success("User created.");
      setDialogOpen(false);
      resetAddForm();
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (err: Error) => toast.error(err.message || "Could not add user."),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: AdminUpdateUserBody;
    }) => adminUpdateUserUseCase(id, body),
    onSuccess: async () => {
      toast.success("User updated.");
      setEditOpen(false);
      setEditUserId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not update user."),
  });

  function resetAddForm() {
    setUserName("");
    setEmail("");
    setPhoneNumber("");
    setPassword("");
    setPasswordConfirm("");
    setRoleId("");
    setAddOrganizationIds([]);
  }

  function toggleAddOrg(orgId: string) {
    setAddOrganizationIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId],
    );
  }

  function toggleEditOrg(orgId: string) {
    setEditOrganizationIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId],
    );
  }

  /** Loads roles first so the role dropdown is never empty due to a fetch race. */
  async function openAddDialog() {
    resetAddForm();
    try {
      const roles = await queryClient.ensureQueryData({
        queryKey: queryKeys.roles,
        queryFn: () => listRolesUseCase(),
      });
      if (!roles.length) {
        toast.error("No roles are configured on the server.");
        return;
      }
      await queryClient.ensureQueryData({
        queryKey: queryKeys.organizations,
        queryFn: () => listOrganizationsUseCase(),
      });
      const defaultRole =
        roles.find((r) => r.name.toLowerCase() === "member") ?? roles[0];
      setRoleId(String(defaultRole.id));
      setDialogOpen(true);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not load roles for this form.",
      );
    }
  }

  function submitAdd() {
    if (!userName.trim()) {
      toast.error("Username is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    const rid = roleId || rolesQuery.data?.[0]?.id;
    const payload: AddUserBody = {
      userName: userName.trim(),
      password,
      passwordConfirm,
      email: email.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      roleId: rid ?? null,
    };
    if (!selectedRoleIsAdmin) {
      payload.organizationIds = [...addOrganizationIds];
    }
    addMutation.mutate(payload);
  }

  function openEdit(user: UserDirectoryEntry) {
    setEditUserId(user.id);
    setEditUserIsAdmin(
      user.roles.some((r) => /^admin$/i.test(String(r).trim())),
    );
    setEditEmail(user.email ?? "");
    setEditPhone(user.phoneNumber ?? "");
    setEditDisplayName(user.displayName ?? "");
    setEditLocked(user.isLockedOut ?? false);
    setEditOrganizationIds(
      (user.organizationIds ?? []).map((id) => String(id)),
    );
    setEditOpen(true);
  }

  function submitEdit() {
    if (!editUserId) return;
    const body: AdminUpdateUserBody = {
      email: editEmail.trim() || null,
      phoneNumber: editPhone.trim() || null,
      displayName: editDisplayName.trim() || null,
      lockAccount: editLocked,
      organizationIds: editUserIsAdmin ? [] : [...editOrganizationIds],
    };
    updateMutation.mutate({
      id: editUserId,
      body,
    });
  }

  return {
    viewState: {
      isAdmin,
      users: usersQuery.data ?? null,
      roles: rolesQuery.data ?? null,
      organizations: organizationsQuery.data ?? null,
      usersLoading: usersQuery.isLoading,
      usersError: usersQuery.error as Error | null,
      dialogOpen,
      userName,
      email,
      phoneNumber,
      password,
      passwordConfirm,
      roleId,
      selectedRoleIsAdmin,
      addOrganizationIds,
      addPending: addMutation.isPending,
      editOpen,
      editUserIsAdmin,
      editEmail,
      editPhone,
      editDisplayName,
      editLocked,
      editOrganizationIds,
      updatePending: updateMutation.isPending,
    },
    actions: {
      setDialogOpen,
      openAddDialog,
      setUserName,
      setEmail,
      setPhoneNumber,
      setPassword,
      setPasswordConfirm,
      setRoleId,
      toggleAddOrg,
      submitAdd,
      setEditOpen,
      openEdit,
      setEditEmail,
      setEditPhone,
      setEditDisplayName,
      setEditLocked,
      toggleEditOrg,
      submitEdit,
    },
  };
}

export type UsersPageViewModel = ReturnType<
  typeof useUsersPageController
>;
