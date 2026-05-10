"use client";

import { Plus } from "lucide-react";
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
import type { FleetPageViewModel } from "@/features/fleet/controllers/fleet-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function FleetPageView({ viewState, actions }: FleetPageViewModel) {
  const t = useTranslations("UiFleet");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    vehicles,
    orgsLoading,
    vehiclesLoading,
    isAdmin,
    vehicleDialogOpen,
    vehicleName,
    plateNumber,
    vehicleTypePresetKey,
    vehicleTypePresets,
    isCustomVehicleType,
    vehicleType,
    maxWeightKg,
    maxVolumeM3,
    maxStopsPerRoute,
    addVehiclePending,
  } = viewState;

  const loading = orgsLoading || vehiclesLoading;

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
              GET /api/vehicles?organizationId=
            </code>
          </p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => actions.setVehicleDialogOpen(true)}
            disabled={!organizations?.length}
          >
            <Plus className="me-2 size-4" />
            {t("addVehicle")}
          </Button>
        ) : null}
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles?.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {v.name}
                  <Badge variant={v.isActive ? "default" : "secondary"}>
                    {v.isActive ? t("active") : t("inactive")}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {v.plateNumber ?? "—"} ·{" "}
                  {v.vehicleType ?? t("vehicleFallback")}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {!vehiclesLoading && vehicles?.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("noVehicles")}</p>
      )}

      <Dialog open={vehicleDialogOpen} onOpenChange={actions.setVehicleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vehicleDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="v-name">{t("vehicleNameLabel")}</Label>
              <Input
                id="v-name"
                value={vehicleName}
                onChange={(e) => actions.setVehicleName(e.target.value)}
                placeholder={t("vehicleNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-plate">{t("plateLabel")}</Label>
              <Input
                id="v-plate"
                value={plateNumber}
                onChange={(e) => actions.setPlateNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("typePresetLabel")}</Label>
              <Select
                value={vehicleTypePresetKey}
                onValueChange={(v) => actions.setVehicleTypePresetKey(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("typePresetPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypePresets.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {t(`presets.${p.key}`)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t("presets.custom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-type">{t("typeLabel")}</Label>
              <Input
                id="v-type"
                value={vehicleType}
                onChange={(e) => actions.setVehicleType(e.target.value)}
                placeholder={t("typePlaceholder")}
                disabled={!isCustomVehicleType}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="v-max-weight">{t("maxWeightKgLabel")}</Label>
                <Input
                  id="v-max-weight"
                  inputMode="decimal"
                  value={maxWeightKg}
                  onChange={(e) => actions.setMaxWeightKg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-max-volume">{t("maxVolumeM3Label")}</Label>
                <Input
                  id="v-max-volume"
                  inputMode="decimal"
                  value={maxVolumeM3}
                  onChange={(e) => actions.setMaxVolumeM3(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-max-stops">{t("maxStopsPerRouteLabel")}</Label>
                <Input
                  id="v-max-stops"
                  inputMode="numeric"
                  value={maxStopsPerRoute}
                  onChange={(e) => actions.setMaxStopsPerRoute(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => actions.setVehicleDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              disabled={addVehiclePending}
              onClick={() => actions.submitVehicle()}
            >
              {addVehiclePending ? tc("saving") : t("addVehicleSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
