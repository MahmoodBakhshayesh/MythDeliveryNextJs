"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { UsersPageViewModel } from "@/features/users/controllers/users-page.controller";

export function UsersPageView({ viewState, actions }: UsersPageViewModel) {
  const t = useTranslations("UiUsers");
  const tc = useTranslations("Common");
  const {
    isAdmin,
    users,
    roles,
    usersLoading,
    dialogOpen,
    userName,
    email,
    phoneNumber,
    password,
    passwordConfirm,
    roleId,
    addPending,
    usersError,
    editOpen,
    editEmail,
    editPhone,
    editDisplayName,
    editLocked,
    updatePending,
  } = viewState;

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("nonAdminTitle")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("nonAdminBody")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Button type="button" onClick={() => void actions.openAddDialog()}>
          <Plus className="me-2 size-4" />
          {t("addUser")}
        </Button>
      </div>

      {usersError ? (
        <p className="text-destructive text-sm">{usersError.message}</p>
      ) : null}

      {usersLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users?.map((u) => (
            <Card key={u.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{u.userName}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => actions.openEdit(u)}
                  >
                    <Pencil className="me-1 size-3.5" />
                    {tc("edit")}
                  </Button>
                </div>
                <CardDescription className="space-y-1">
                  <span className="block">{u.email ?? "—"}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                    {u.isLockedOut ? (
                      <Badge variant="destructive" className="text-xs">
                        {t("locked")}
                      </Badge>
                    ) : null}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={actions.setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="u-name">{t("username")}</Label>
              <Input
                id="u-name"
                value={userName}
                onChange={(e) => actions.setUserName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">{t("emailOptional")}</Label>
              <Input
                id="u-email"
                type="email"
                value={email}
                onChange={(e) => actions.setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">{t("phoneOptional")}</Label>
              <Input
                id="u-phone"
                value={phoneNumber}
                onChange={(e) => actions.setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-role">{t("role")}</Label>
              <Select
                value={roleId}
                onValueChange={(v) => actions.setRoleId(v ?? "")}
              >
                <SelectTrigger id="u-role">
                  <SelectValue placeholder={t("selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pw">{tc("password")}</Label>
              <Input
                id="u-pw"
                type="password"
                value={password}
                onChange={(e) => actions.setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pw2">{t("confirmPassword")}</Label>
              <Input
                id="u-pw2"
                type="password"
                value={passwordConfirm}
                onChange={(e) => actions.setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => actions.setDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={addPending} onClick={actions.submitAdd}>
              {addPending ? tc("creating") : t("createUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={actions.setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-email">{tc("email")}</Label>
              <Input
                id="e-email"
                type="email"
                value={editEmail}
                onChange={(e) => actions.setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-phone">{tc("phone")}</Label>
              <Input
                id="e-phone"
                value={editPhone}
                onChange={(e) => actions.setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-dn">{t("displayName")}</Label>
              <Input
                id="e-dn"
                value={editDisplayName}
                onChange={(e) => actions.setEditDisplayName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="e-lock"
                type="checkbox"
                className="size-4 rounded border"
                checked={editLocked}
                onChange={(e) => actions.setEditLocked(e.target.checked)}
              />
              <Label htmlFor="e-lock" className="font-normal">
                {t("lockAccount")}
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => actions.setEditOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              disabled={updatePending}
              onClick={() => actions.submitEdit()}
            >
              {updatePending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
