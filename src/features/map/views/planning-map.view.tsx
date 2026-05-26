"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
  type RouteStopEditMapContext,
} from "@/features/map/domain/planning-map.types";
import { DeliveryStopEditDialog } from "@/features/map/components/delivery-stop-edit-dialog";
import { PlanningMapSidebar } from "@/features/map/components/planning-map-sidebar";
import { deliveryStopToUpdateBody } from "@/features/map/lib/delivery-stop-update-body";

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
  const tre = useTranslations("UiRouteEdit");
  const [mapSelectedDeliveryStopId, setMapSelectedDeliveryStopId] = useState<
    string | null
  >(null);
  const [repositioningDeliveryStopId, setRepositioningDeliveryStopId] =
    useState<string | null>(null);
  const [deliveryStopEditorId, setDeliveryStopEditorId] = useState<
    string | null
  >(null);
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
    mapRoutes,
    mapStops,
    fleetVehicleIds,
    fleetVehicles,
    stopEditBusy,
  } = viewState;

  useEffect(() => {
    setMapSelectedDeliveryStopId(null);
    setRepositioningDeliveryStopId(null);
    setDeliveryStopEditorId(null);
  }, [selectedPlanningWindowId]);

  const selectorsBusy = orgsLoading || planningWindowsLoading;
  const regionOption = POLYGON_REGION_OPTIONS.find(
    (o) => o.value === polygonRegionAlgorithm,
  );
  const canShowMap =
    !!selectedOrgId &&
    !!selectedPlanningWindowId &&
    !!overlay &&
    !snapshotLoading;

  const routeEditActive =
    !!selectedPlanningWindowId &&
    !!mapRoutes?.length &&
    !selectedPlanningWindow?.isConfirmed;

  const routeStopEditContext: RouteStopEditMapContext | null =
    routeEditActive && mapRoutes && mapStops != null
      ? {
          planningWindowId: selectedPlanningWindowId,
          organizationId: selectedOrgId,
          isConfirmed: Boolean(selectedPlanningWindow?.isConfirmed),
          routes: mapRoutes,
          stops: mapStops,
          onAfterMutation: actions.refreshMapSnapshot,
          repositioningDeliveryStopId,
          onRepositioningDeliveryStopChange: setRepositioningDeliveryStopId,
          onEditDeliveryStop: (id) => setDeliveryStopEditorId(id),
          onRepositionDragEnd: async (id, lat, lng) => {
            const st = mapStops.find((x) => x.id === id);
            if (!st) return;
            await actions.updateDeliveryStop(
              id,
              deliveryStopToUpdateBody(st, { latitude: lat, longitude: lng }),
            );
            setRepositioningDeliveryStopId(null);
            setMapSelectedDeliveryStopId(null);
          },
          removeVisit: actions.removeVisitFromRoute,
          deleteStop: actions.deleteDeliveryStop,
          stopEditBusy,
        }
      : null;

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

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="relative h-[min(70vh,560px)] min-w-0 w-full overflow-hidden rounded-lg bg-muted">
          {snapshotLoading && (
            <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
          )}
          {canShowMap ? (
            <PlanningMapLeaflet
              overlay={overlay}
              onMapClick={actions.openAddDialogAt}
              selectedDeliveryStopId={
                routeEditActive ? mapSelectedDeliveryStopId : undefined
              }
              onDeliveryStopSelect={
                routeEditActive ? setMapSelectedDeliveryStopId : undefined
              }
              routeStopEdit={routeStopEditContext}
            />
          ) : !snapshotLoading ? (
            <div className="text-muted-foreground flex size-full items-center justify-center p-6 text-center text-sm">
              {selectedOrgId && selectedPlanningWindowId
                ? t("emptyNoData")
                : t("emptySelectOrgWindow")}
            </div>
          ) : null}
          {canShowMap && repositioningDeliveryStopId ? (
            <p className="text-muted-foreground pointer-events-none absolute bottom-2 left-2 right-2 z-[410] rounded-md border bg-background/95 px-2 py-1.5 text-center text-xs shadow-sm">
              {tre("mapDragRepositionHint")}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <PlanningMapSidebar
            overlay={overlay}
            polygonAlgorithm={polygonRegionAlgorithm}
            mapStops={mapStops}
            routes={mapRoutes ?? undefined}
            fleetVehicleIds={fleetVehicleIds}
            fleetVehicles={fleetVehicles ?? undefined}
            canShowMap={canShowMap}
            routeEditActive={routeEditActive}
            isConfirmed={Boolean(selectedPlanningWindow?.isConfirmed)}
            planningWindowId={selectedPlanningWindowId}
            selectedDeliveryStopId={mapSelectedDeliveryStopId}
            onClearMapSelection={() => setMapSelectedDeliveryStopId(null)}
            repositioningDeliveryStopId={repositioningDeliveryStopId}
            onEditStop={setDeliveryStopEditorId}
            onStartReposition={setRepositioningDeliveryStopId}
            onAfterMutation={actions.refreshMapSnapshot}
          />
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

      <DeliveryStopEditDialog
        open={deliveryStopEditorId !== null}
        onOpenChange={(open) => {
          if (!open) setDeliveryStopEditorId(null);
        }}
        stop={
          deliveryStopEditorId && mapStops
            ? (mapStops.find((x) => x.id === deliveryStopEditorId) ?? null)
            : null
        }
        defaultServiceDate={selectedPlanningWindow?.serviceDate ?? null}
        saving={stopEditBusy}
        onSave={(body) =>
          deliveryStopEditorId
            ? actions.updateDeliveryStop(deliveryStopEditorId, body)
            : Promise.resolve()
        }
      />
    </div>
  );
}
