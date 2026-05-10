"use client";

import dynamic from "next/dynamic";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanningMapViewModel } from "@/features/map/controllers/planning-map.controller";
import {
  POLYGON_REGION_OPTIONS,
  type PolygonRegionAlgorithm,
} from "@/features/map/domain/planning-map.types";

const PlanningMapLeaflet = dynamic(
  () =>
    import("@/features/map/components/planning-map-leaflet").then(
      (m) => m.PlanningMapLeaflet,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="min-h-[420px] w-full rounded-lg" />,
  },
);

export function PlanningMapView({ viewState, actions }: PlanningMapViewModel) {
  const t = useTranslations("UiMap");
  const tc = useTranslations("Common");
  const tg = useTranslations("UiGeocoding");
  const {
    organizations,
    planningWindows,
    selectedPlanningWindow,
    selectedOrgId,
    selectedPlanningWindowId,
    overlay,
    snapshotLoading,
    snapshotError,
    orgsLoading,
    planningWindowsLoading,
    polygonRegionAlgorithm,
    addDialogOpen,
    pendingLat,
    pendingLng,
    recipientName,
    addressLine1,
    addPending,
    reverseGeocodePending,
    geocodeSearchPending,
  } = viewState;

  const selectorsBusy = orgsLoading || planningWindowsLoading;
  const regionOption = POLYGON_REGION_OPTIONS.find(
    (o) => o.value === polygonRegionAlgorithm,
  );
  const canShowMap =
    !!selectedOrgId &&
    !!selectedPlanningWindowId &&
    !!overlay &&
    !snapshotLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {selectedPlanningWindow?.isConfirmed ? (
        <p className="text-amber-600 text-sm">{t("confirmedLockedHint")}</p>
      ) : null}

      <div className="flex max-w-2xl flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label>{tc("organization")}</Label>
          <Select
            value={selectedOrgId}
            onValueChange={(v) => actions.setOrgId(v)}
            disabled={orgsLoading || !organizations?.length}
            items={(organizations ?? []).map((o) => ({
              value: o.id,
              label: o.name,
            }))}
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
        <div className="flex-1 space-y-2">
          <Label>{t("planningWindow")}</Label>
          <Select
            value={selectedPlanningWindowId}
            onValueChange={(v) => actions.setPlanningWindowId(v)}
            disabled={
              selectorsBusy || !planningWindows?.length || !selectedOrgId
            }
            items={(planningWindows ?? []).map((w) => ({
              value: w.id,
              label: w.name,
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("planningWindowPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {planningWindows?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-2xl space-y-2">
        <Label htmlFor="polygon-region">{t("regionAlgorithm")}</Label>
        <Select
          value={polygonRegionAlgorithm}
          onValueChange={(v) =>
            actions.setPolygonRegionAlgorithm(v as PolygonRegionAlgorithm)
          }
          disabled={selectorsBusy}
          items={POLYGON_REGION_OPTIONS.map((opt) => ({
            value: opt.value,
            label: t(`polygon.${opt.value}.label`),
          }))}
        >
          <SelectTrigger id="polygon-region">
            <SelectValue placeholder={t("outlineStylePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {POLYGON_REGION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`polygon.${opt.value}.label`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {regionOption ? (
          <p className="text-muted-foreground text-xs leading-snug">
            {t(`polygon.${regionOption.value}.description`)}
          </p>
        ) : null}
      </div>

      {snapshotError ? (
        <p className="text-destructive text-sm">
          {snapshotError.message || t("failedLoadMap")}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-lg bg-muted">
          {snapshotLoading && (
            <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
          )}
          {canShowMap ? (
            <PlanningMapLeaflet
              overlay={overlay}
              onMapClick={actions.openAddDialogAt}
            />
          ) : !snapshotLoading ? (
            <div className="text-muted-foreground flex size-full items-center justify-center p-6 text-center text-sm">
              {selectedOrgId && selectedPlanningWindowId
                ? t("emptyNoData")
                : t("emptySelectOrgWindow")}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("routesTitle")}</CardTitle>
              <CardDescription>{t("routesDesc")}</CardDescription>
            </CardHeader>
          </Card>
          <div className="flex flex-col gap-2">
            {overlay?.routes.length ? (
              overlay.routes.map((r) => (
                <div
                  key={r.routeId}
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate font-medium">{r.driverName}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">{t("noRoutes")}</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={actions.setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addStopTitle")}</DialogTitle>
            <DialogDescription>
              {pendingLat != null && pendingLng != null ? (
                <>
                  {t("coordinates")}{" "}
                  <span className="font-mono text-xs">
                    {pendingLat.toFixed(5)}, {pendingLng.toFixed(5)}
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recipient">{t("recipientName")}</Label>
            <Input
              id="recipient"
              value={recipientName}
              onChange={(e) => actions.setRecipientName(e.target.value)}
              placeholder={t("recipientPlaceholder")}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="stop-address">{tg("addressLabel")}</Label>
                <Input
                  id="stop-address"
                  value={addressLine1}
                  onChange={(e) => actions.setAddressLine1(e.target.value)}
                  placeholder={tg("addressPlaceholder")}
                  autoComplete="street-address"
                  disabled={reverseGeocodePending}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={
                  geocodeSearchPending ||
                  reverseGeocodePending ||
                  !addressLine1.trim()
                }
                onClick={() => actions.lookupCoordinatesFromAddress()}
              >
                {geocodeSearchPending ? tg("searching") : tg("findCoordinates")}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">{tg("hint")}</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => actions.setAddDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => actions.submitAddStop()}
              disabled={addPending}
            >
              {addPending ? tc("saving") : t("addStop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
