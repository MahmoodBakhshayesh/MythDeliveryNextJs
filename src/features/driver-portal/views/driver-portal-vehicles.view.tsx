"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DriverPortalVehiclesViewModel } from "@/features/driver-portal/controllers/driver-portal-vehicles.controller";

export function DriverPortalVehiclesView({
  viewState,
  actions,
}: DriverPortalVehiclesViewModel) {
  const t = useTranslations("UiDriverPortal");
  const tc = useTranslations("Common");
  const {
    vehicles,
    loading,
    dialogOpen,
    editing,
    name,
    plateNumber,
    vin,
    vehicleType,
    isActive,
    savePending,
    deletePending,
  } = viewState;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("vehiclesTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {t("vehiclesSubtitle")}
          </p>
        </div>
        <Button type="button" onClick={() => actions.openCreate()}>
          <Plus className="me-2 size-4" />
          {t("addPersonalVehicle")}
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : vehicles?.length ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-start">
                <th className="px-3 py-2 font-medium">{tc("name")}</th>
                <th className="px-3 py-2 font-medium">{t("plate")}</th>
                <th className="px-3 py-2 font-medium">{tc("status")}</th>
                <th className="w-[100px] px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{v.name}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {v.plateNumber ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={v.isActive ? "secondary" : "outline"}>
                      {v.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tc("edit")}
                        onClick={() => actions.openEdit(v)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("deleteVehicle")}
                        disabled={deletePending}
                        onClick={() => actions.deleteVehicle(v.id)}
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
            <CardTitle>{t("vehiclesEmptyTitle")}</CardTitle>
            <CardDescription>{t("vehiclesEmptyDesc")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && actions.closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editPersonalVehicle") : t("addPersonalVehicle")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pv-name">{tc("name")}</Label>
              <Input
                id="pv-name"
                value={name}
                onChange={(e) => actions.setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pv-plate">{t("plate")}</Label>
              <Input
                id="pv-plate"
                value={plateNumber}
                onChange={(e) => actions.setPlateNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pv-vin">{t("vin")}</Label>
              <Input id="pv-vin" value={vin} onChange={(e) => actions.setVin(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pv-type">{t("vehicleType")}</Label>
              <Input
                id="pv-type"
                value={vehicleType}
                onChange={(e) => actions.setVehicleType(e.target.value)}
              />
            </div>
            {editing ? (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="border-input size-4 rounded border"
                  checked={isActive}
                  onChange={(e) => actions.setIsActive(e.target.checked)}
                />
                <span className="text-sm font-medium">{t("activeVehicle")}</span>
              </label>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => actions.closeDialog()}>
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={savePending} onClick={() => actions.submit()}>
              {savePending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
