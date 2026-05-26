"use client";

import { Building2, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrganizationsListViewModel } from "@/features/organizations/controllers/organizations-list.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OrganizationsListView({
  viewState,
  actions,
}: OrganizationsListViewModel) {
  const t = useTranslations("UiOrganizations");
  const tc = useTranslations("Common");
  const {
    organizations,
    isLoading,
    errorMessage,
    isAdmin,
    addOpen,
    newOrgName,
    addPending,
    editOpen,
    editName,
    editDescription,
    editAllowManualStops,
    editShowPlanTimeZone,
    updatePending,
  } = viewState;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("subtitleFromApi")}{" "}
            <code className="rounded bg-muted px-1">GET /api/organizations</code>
          </p>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={() => actions.setAddOpen(true)}>
            <Plus className="me-2 size-4" />
            {t("addOrganization")}
          </Button>
        ) : null}
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base leading-tight">
                  <Building2 className="size-4 shrink-0" />
                  {org.name}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => actions.openEdit(org)}
                >
                  <Pencil className="me-1 size-3.5" />
                  {tc("edit")}
                </Button>
              </div>
              {org.description ? (
                <CardDescription className="text-sm leading-snug">
                  {org.description}
                </CardDescription>
              ) : null}
              <CardDescription className="font-mono text-xs">
                {org.id}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={actions.setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="org-name">{t("nameLabel")}</Label>
            <Input
              id="org-name"
              value={newOrgName}
              onChange={(e) => actions.setNewOrgName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => actions.setAddOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              disabled={addPending}
              onClick={() => actions.submitAdd()}
            >
              {addPending ? tc("saving") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={actions.setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">{t("nameLabel")}</Label>
              <Input
                id="edit-org-name"
                value={editName}
                onChange={(e) => actions.setEditName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-desc">{t("descriptionLabel")}</Label>
              <Textarea
                id="edit-org-desc"
                value={editDescription}
                onChange={(e) => actions.setEditDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="resize-y"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editAllowManualStops}
                onChange={(e) => actions.setEditAllowManualStops(e.target.checked)}
              />
              {t("allowManualDeliveryStops")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editShowPlanTimeZone}
                onChange={(e) => actions.setEditShowPlanTimeZone(e.target.checked)}
              />
              {t("showPlanWizardTimeZone")}
            </label>
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
