"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DriversPageViewModel } from "@/features/drivers/controllers/drivers-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DriversPageView({ viewState, actions }: DriversPageViewModel) {
  const t = useTranslations("UiDrivers");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    drivers,
    orgsLoading,
    driversLoading,
    dialogOpen,
    editing,
    displayName,
    phone,
    licenseNumber,
    isActive,
    savePending,
    deletePending,
  } = viewState;

  const loading = orgsLoading || driversLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("subtitleFromApi")}{" "}
            <code className="rounded bg-muted px-1">
              GET /api/drivers?organizationId=
            </code>
          </p>
        </div>
        <Button
          type="button"
          onClick={() => actions.openCreate()}
          disabled={!organizations?.length}
        >
          <Plus className="me-2 size-4" />
          {t("addDriver")}
        </Button>
      </div>

      <div className="max-w-md space-y-2">
        <Label>{tc("organization")}</Label>
        <Select
          value={selectedOrgId}
          onValueChange={(v) => actions.setOrgId(v)}
          disabled={orgsLoading || !organizations?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder={tc("selectOrganization")} />
          </SelectTrigger>
          <SelectContent>
            {organizations?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : drivers?.length ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-start">
                <th className="px-3 py-2 font-medium">{tc("name")}</th>
                <th className="px-3 py-2 font-medium">{tc("phone")}</th>
                <th className="px-3 py-2 font-medium">{t("license")}</th>
                <th className="px-3 py-2 font-medium">{tc("status")}</th>
                <th className="px-3 py-2 font-medium w-[120px]" />
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{d.displayName}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {d.phone ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {d.licenseNumber ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={d.isActive ? "secondary" : "outline"}>
                      {d.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tc("edit")}
                        onClick={() => actions.openEdit(d)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("delete")}
                        disabled={deletePending}
                        onClick={() => actions.deleteDriver(d.id)}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription>{t("emptyDesc")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={actions.setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editDriver") : t("addDriver")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="drv-name">{tc("name")}</Label>
              <Input
                id="drv-name"
                value={displayName}
                onChange={(e) => actions.setDisplayName(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drv-phone">{tc("phone")}</Label>
              <Input
                id="drv-phone"
                value={phone}
                onChange={(e) => actions.setPhone(e.target.value)}
                placeholder={t("phoneOptional")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drv-license">{t("license")}</Label>
              <Input
                id="drv-license"
                value={licenseNumber}
                onChange={(e) => actions.setLicenseNumber(e.target.value)}
                placeholder={t("licenseOptional")}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                id="drv-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => actions.setIsActive(e.target.checked)}
                className="border-input size-4 rounded border"
              />
              <span className="text-sm font-medium leading-none">
                {t("activeLabel")}
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => actions.setDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => actions.submit()}
              disabled={savePending}
            >
              {savePending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
