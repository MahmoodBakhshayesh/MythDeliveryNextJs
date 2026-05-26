"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanWorkflowViewModel } from "@/features/plan-workflow/controllers/plan-workflow.controller";
import {
  POLYGON_REGION_OPTIONS,
  type PolygonRegionAlgorithm,
  type RouteStopEditMapContext,
} from "@/features/map/domain/planning-map.types";
import { DeliveryStopEditDialog } from "@/features/map/components/delivery-stop-edit-dialog";
import { PlanningMapDraftToolbar } from "@/features/map/components/planning-map-draft-toolbar";
import { PlanningMapSidebar } from "@/features/map/components/planning-map-sidebar";
import { RouteDriverAssignmentList } from "@/features/plan-workflow/components/route-driver-assignment-list";
import { deliveryStopToUpdateBody } from "@/features/map/lib/delivery-stop-update-body";
import { cn } from "@/lib/utils";

function planningMapLeafletKey(overlay: NonNullable<PlanWorkflowViewModel["viewState"]["overlay"]>) {
  const routePart = overlay.routes
    .map((r) => r.routeId)
    .sort()
    .join(",");
  const stopPart = overlay.stops
    .map((s) => s.id)
    .sort()
    .join(",");
  return `${routePart}|${stopPart}`;
}

const PlanningMapLeaflet = dynamic(
  () =>
    import("@/features/map/components/planning-map-leaflet").then(
      (m) => m.PlanningMapLeaflet,
    ),
  { ssr: false, loading: () => <Skeleton className="min-h-[420px] w-full rounded-lg" /> },
);
const LocationPickerLeaflet = dynamic(
  () =>
    import("@/features/map/components/location-picker-leaflet").then(
      (m) => m.LocationPickerLeaflet,
    ),
  { ssr: false },
);

export function PlanWorkflowView({ viewState, actions }: PlanWorkflowViewModel) {
  const t = useTranslations("UiPlanWorkflow");
  const tc = useTranslations("Common");
  const td = useTranslations("UiDeliveries");
  const tm = useTranslations("UiMap");
  const tre = useTranslations("UiRouteEdit");
  const tg = useTranslations("UiGeocoding");

  const stepTitles = [
    t("steps.planDate"),
    t("steps.vehicles"),
    t("steps.deliveries"),
    t("steps.preview"),
    t("steps.confirm"),
    t("steps.assignDrivers"),
    t("steps.overview"),
  ];

  const {
    step,
    stepsTotal,
    organizations,
    selectedOrgId,
    planDate,
    planName,
    timeZoneId,
    planId,
    planningStrategy,
    planningStrategies,
    polygonAlgorithm,
    drivers,
    vehicles,
    stops,
    stopsLoading,
    snapshot,
    mapStops,
    stopEditBusy,
    overlay,
    snapshotLoading,
    lastImport,
    fileInputRef,
    recipientName,
    latitude,
    longitude,
    addressLine1,
    city,
    region,
    postalCode,
    country,
    phone,
    mapPickerOpen,
    pickedPoint,
    timeSection,
    itemSku,
    itemDescription,
    itemQuantity,
    timeSections,
    selectedVehicleIds,
    routeDriverByRouteId,
    selectedMapRouteId,
    lockOrgPicker,
    lockDcPicker,
    showTimeZoneField,
    allowManualStops,
    planDetail,
    planDetailLoading,
    workPlans,
    workPlansLoading,
    selectedWorkPlanId,
    distributionCenters,
    distributionCentersLoading,
    selectedDistributionCenterId,
    assignRouteDriversPending,
    orgsLoading,
    driversLoading,
    vehiclesLoading,
    createPlanPending,
    addStopPending,
    reverseGeocodePending,
    geocodeSearchPending,
    applyPickedPointPending,
    importPending,
    draftPending,
    confirmPending,
    reopenPending,
    fleetPdfPending,
    driversZipPending,
    jsonExportPending,
  } = viewState;

  const [mapSelectedDeliveryStopId, setMapSelectedDeliveryStopId] = useState<
    string | null
  >(null);
  const [repositioningDeliveryStopId, setRepositioningDeliveryStopId] =
    useState<string | null>(null);
  const [deliveryStopEditorId, setDeliveryStopEditorId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setMapSelectedDeliveryStopId(null);
    setRepositioningDeliveryStopId(null);
    setDeliveryStopEditorId(null);
    actions.setSelectedMapRouteId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset map pickers when plan changes
  }, [planId]);

  const overlayRouteKey = (overlay?.routes ?? [])
    .map((r) => r.routeId)
    .sort()
    .join(",");
  useEffect(() => {
    actions.setSelectedMapRouteId(null);
    setMapSelectedDeliveryStopId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when routes regenerate
  }, [overlayRouteKey]);

  const routeEditActive =
    Boolean(planId) &&
    Boolean(snapshot?.routes?.length) &&
    !planDetail?.isConfirmed;

  const fleetVehicleIds = useMemo(
    () => vehicles?.filter((v) => v.isActive).map((v) => v.id) ?? [],
    [vehicles],
  );

  const routeStopEditContext: RouteStopEditMapContext | null =
    routeEditActive && snapshot?.routes && mapStops != null && planId
      ? {
          planningWindowId: planId,
          organizationId: selectedOrgId,
          isConfirmed: Boolean(planDetail?.isConfirmed),
          routes: snapshot.routes,
          stops: mapStops,
          onAfterMutation: actions.refreshPlanningMapSnapshot,
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {stepTitles.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => {
              if (i <= step || (planId && i > 0)) actions.setStep(i);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              i === step
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
              i > step && !planId && i > 0
                ? "cursor-not-allowed opacity-50"
                : "",
            )}
            disabled={i > step && !planId && i > 0}
          >
            <span className="bg-background flex size-6 items-center justify-center rounded-full border text-[11px]">
              {i + 1}
            </span>
            {title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("stepLabel", { current: step + 1, total: stepsTotal })}:{" "}
            {stepTitles[step]}
          </CardTitle>
          <CardDescription>{t(`stepHints.${step}`)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 ? (
            <div className="mx-auto max-w-lg space-y-4">
                {lockOrgPicker ? (
                  organizations?.[0] ? (
                    <p className="text-muted-foreground text-sm">
                      {tc("organization")}:{" "}
                      <span className="text-foreground font-medium">
                        {organizations.find((o) => o.id === selectedOrgId)?.name ??
                          organizations[0].name}
                      </span>
                    </p>
                  ) : null
                ) : (
                  <div className="space-y-2">
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
                )}
                <div className="space-y-2">
                  <Label htmlFor="wf-plan-date">{t("planDate")}</Label>
                  <Input
                    id="wf-plan-date"
                    type="date"
                    value={planDate}
                    onChange={(e) => actions.setPlanDate(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t("planDateHelp")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wf-plan-name">{tc("name")}</Label>
                  <Input
                    id="wf-plan-name"
                    value={planName}
                    onChange={(e) => actions.setPlanName(e.target.value)}
                    placeholder={t("planNamePlaceholder")}
                  />
                </div>
                {showTimeZoneField ? (
                  <div className="space-y-2">
                    <Label htmlFor="wf-tz">{t("timeZoneRequired")}</Label>
                    <Input
                      id="wf-tz"
                      value={timeZoneId}
                      onChange={(e) => actions.setTimeZoneId(e.target.value)}
                      placeholder={t("timeZonePlaceholder")}
                    />
                  </div>
                ) : null}
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <Label>{t("workPlanPick")}</Label>
                  <Select
                    value={selectedWorkPlanId}
                    onValueChange={(v) => actions.setSelectedWorkPlanId(v ?? "")}
                    disabled={workPlansLoading || !(workPlans?.length)}
                    items={(workPlans ?? []).map((wp) => ({
                      value: wp.id,
                      label: wp.name,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("workPlanPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(workPlans ?? []).map((wp) => (
                        <SelectItem key={wp.id} value={wp.id}>
                          {wp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!workPlansLoading && !(workPlans?.length) ? (
                    <p className="text-destructive text-xs">{t("noWorkPlans")}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    <Link href="/work-plans" className="text-primary underline">
                      {t("manageWorkPlans")}
                    </Link>
                  </p>
                </div>
                {lockDcPicker ? (
                  distributionCenters?.[0] ? (
                    <p className="text-muted-foreground rounded-md border bg-muted/30 p-3 text-sm">
                      {t("storagePick")}:{" "}
                      <span className="text-foreground font-medium">
                        {distributionCenters.find(
                          (s) => s.id === selectedDistributionCenterId,
                        )?.name ?? distributionCenters[0].name}
                      </span>
                    </p>
                  ) : null
                ) : (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <Label>{t("storagePick")}</Label>
                    <Select
                      value={selectedDistributionCenterId}
                      onValueChange={(v) =>
                        actions.setSelectedDistributionCenterId(v ?? "")
                      }
                      disabled={
                        distributionCentersLoading ||
                        !(distributionCenters?.length)
                      }
                      items={(distributionCenters ?? []).map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("storagePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(distributionCenters ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!distributionCentersLoading &&
                    !(distributionCenters?.length) ? (
                      <p className="text-destructive text-xs">{t("noStorages")}</p>
                    ) : null}
                    <p className="text-muted-foreground text-xs">
                      {t("storageHelp")}{" "}
                      <Link
                        href="/distribution-centers"
                        className="text-primary underline"
                      >
                        {t("manageStorages")}
                      </Link>
                    </p>
                  </div>
                )}
                {planId ? (
                  <div className="space-y-2 pt-2">
                    <Badge variant="outline">
                      {t("activePlan")}: {planId.slice(0, 8)}…
                    </Badge>
                    <p className="text-muted-foreground text-xs">
                      {t("continuePlanHint")}{" "}
                      <Link href="/fleet-plans" className="text-primary underline">
                        {t("openFleetPlans")}
                      </Link>
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("noActivePlan")}</p>
                )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm">
                {t("vehiclesIntro")}{" "}
                <Link href="/fleet" className="text-primary underline">
                  {t("openFleet")}
                </Link>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => actions.selectAllVehicles()}
                >
                  {t("selectAll")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => actions.clearVehicles()}
                >
                  {t("clearAll")}
                </Button>
              </div>
              {vehiclesLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : vehicles?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {vehicles.map((v) => {
                    const checked = selectedVehicleIds.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="truncate">
                          {v.name}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {v.maxWeightKg} kg · {v.maxVolumeM3} m³
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            actions.toggleVehicle(v.id, e.target.checked)
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t("noFleetVehicles")}</p>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void actions.downloadTemplate()}
                >
                  {td("downloadTemplate")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => actions.onPickExcel()}
                  disabled={importPending}
                >
                  {importPending ? td("importing") : td("uploadExcel")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={actions.onFileChange}
                />
              </div>
              {lastImport ? (
                <p className="text-muted-foreground text-xs">
                  {td("lastImportLabel")}: {lastImport.originalFileName} —{" "}
                  {lastImport.importedRows} / {lastImport.totalRows}
                </p>
              ) : null}
              {allowManualStops ? (
                <>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tm("recipientName")}</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => actions.setRecipientName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{td("latitude")}</Label>
                    <Input
                      inputMode="decimal"
                      value={latitude}
                      onChange={(e) => actions.setLatitude(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{td("longitude")}</Label>
                    <Input
                      inputMode="decimal"
                      value={longitude}
                      onChange={(e) => actions.setLongitude(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>{td("addressLine1")}</Label>
                      <Input
                        value={addressLine1}
                        onChange={(e) => actions.setAddressLine1(e.target.value)}
                        placeholder={tg("addressPlaceholder")}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      disabled={
                        geocodeSearchPending || !addressLine1.trim()
                      }
                      onClick={() =>
                        actions.lookupCoordinatesFromAddress()
                      }
                    >
                      {geocodeSearchPending
                        ? tg("searching")
                        : td("findCoordinates")}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={reverseGeocodePending}
                    onClick={() => actions.lookupAddressFromCoords()}
                  >
                    {reverseGeocodePending
                      ? tg("searching")
                      : td("lookupAddressFromCoords")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => actions.setMapPickerOpen(true)}
                  >
                    Select address from map
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    {tg("hintDeliveries")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => actions.setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region/State</Label>
                  <Input
                    value={region}
                    onChange={(e) => actions.setRegion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal code</Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => actions.setPostalCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={country}
                    onChange={(e) => actions.setCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tc("phone")}</Label>
                  <Input
                    value={phone}
                    onChange={(e) => actions.setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item quantity *</Label>
                  <Input
                    inputMode="decimal"
                    value={itemQuantity}
                    onChange={(e) => actions.setItemQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item SKU</Label>
                  <Input
                    value={itemSku}
                    onChange={(e) => actions.setItemSku(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item description</Label>
                  <Input
                    value={itemDescription}
                    onChange={(e) => actions.setItemDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("timeSectionOptional")}</Label>
                  <Select
                    value={timeSection || "__none__"}
                    onValueChange={(v) =>
                      actions.setTimeSection(v === "__none__" ? "" : (v ?? ""))
                    }
                    items={[
                      { value: "__none__", label: t("anyTimeSameDay") },
                      ...timeSections.map((s) => ({
                        value: String(s.value),
                        label: s.label,
                      })),
                    ]}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("anyTimeSameDay")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("anyTimeSameDay")}</SelectItem>
                      {timeSections.map((s) => (
                        <SelectItem key={s.value} value={String(s.value)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    {t("serviceDateUsesPlanDay", { date: planDate })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => actions.addStop()}
                disabled={addStopPending}
              >
                {addStopPending ? tc("creating") : td("addStop")}
              </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">{t("manualStopsDisabled")}</p>
              )}
              <Separator />
              <div>
                <h4 className="mb-2 font-medium">{t("stopsForPlan")}</h4>
                {stopsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : stops?.length ? (
                  <p className="text-muted-foreground text-sm">
                    {t("stopCount", { count: stops.length })}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noStopsYet")}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex min-h-[min(82vh,760px)] flex-col gap-2">
              <PlanningMapDraftToolbar
                planningStrategy={planningStrategy}
                planningStrategies={planningStrategies}
                onPlanningStrategyChange={(v) =>
                  actions.setPlanningStrategy(
                    (v as typeof planningStrategy) ?? "SpatialCell",
                  )
                }
                polygonAlgorithm={polygonAlgorithm}
                onPolygonAlgorithmChange={(v) => actions.setPolygonAlgorithm(v)}
                onGenerateDraftRoutes={() => actions.generateDraftRoutes()}
                generateDisabled={
                  draftPending ||
                  Boolean(planDetail?.isConfirmed) ||
                  selectedVehicleIds.length === 0
                }
                generatePending={draftPending}
                lockedHint={
                  planDetail?.isConfirmed ? t("lockedRegenerateHint") : null
                }
              />
              <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[1fr_minmax(300px,400px)]">
                <div className="relative min-h-[min(50vh,420px)] min-w-0 flex-1 overflow-hidden rounded-lg bg-muted xl:min-h-0">
                  {snapshotLoading && (
                    <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
                  )}
                  {overlay ? (
                    <PlanningMapLeaflet
                      key={planningMapLeafletKey(overlay)}
                      overlay={overlay}
                      onMapClick={() => {}}
                      polygonPickMode
                      selectedRouteId={selectedMapRouteId}
                      onRouteSelect={actions.setSelectedMapRouteId}
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
                      {t("overviewEmpty")}
                    </div>
                  ) : null}
                  {overlay && repositioningDeliveryStopId ? (
                    <p className="text-muted-foreground pointer-events-none absolute bottom-2 left-2 right-2 z-[410] rounded-md border bg-background/95 px-2 py-1.5 text-center text-xs shadow-sm">
                      {tre("mapDragRepositionHint")}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-h-0 min-w-0 flex-col xl:min-h-0">
                  <PlanningMapSidebar
                    fillHeight
                    overlay={overlay}
                    polygonAlgorithm={polygonAlgorithm}
                    mapStops={mapStops}
                    routes={snapshot?.routes ?? undefined}
                    fleetVehicleIds={fleetVehicleIds}
                    fleetVehicles={vehicles ?? undefined}
                    planVehicleIds={selectedVehicleIds}
                    highlightedRouteId={selectedMapRouteId}
                    onHighlightRoute={actions.setSelectedMapRouteId}
                    canShowMap={Boolean(overlay)}
                    routeEditActive={routeEditActive}
                    isConfirmed={Boolean(planDetail?.isConfirmed)}
                    planningWindowId={planId}
                    selectedDeliveryStopId={mapSelectedDeliveryStopId}
                    onClearMapSelection={() => setMapSelectedDeliveryStopId(null)}
                    repositioningDeliveryStopId={repositioningDeliveryStopId}
                    onEditStop={setDeliveryStopEditorId}
                    onStartReposition={setRepositioningDeliveryStopId}
                    onAfterMutation={actions.refreshPlanningMapSnapshot}
                  />
                </div>
              </div>
              <p className="text-muted-foreground shrink-0 text-xs leading-snug">
                {t("previewHelp")} {t("polygonPickHint")} {t("routeEditHint")}
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex min-h-[min(82vh,760px)] flex-col gap-2">
              <PlanningMapDraftToolbar
                planningStrategy={planningStrategy}
                planningStrategies={planningStrategies}
                onPlanningStrategyChange={(v) =>
                  actions.setPlanningStrategy(
                    (v as typeof planningStrategy) ?? "SpatialCell",
                  )
                }
                polygonAlgorithm={polygonAlgorithm}
                onPolygonAlgorithmChange={(v) => actions.setPolygonAlgorithm(v)}
                onGenerateDraftRoutes={() => actions.generateDraftRoutes()}
                generateDisabled={
                  draftPending ||
                  Boolean(planDetail?.isConfirmed) ||
                  selectedVehicleIds.length === 0
                }
                generatePending={draftPending}
                lockedHint={
                  planDetail?.isConfirmed ? t("lockedRegenerateHint") : null
                }
              />
              <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[1fr_minmax(300px,400px)]">
                <div className="relative min-h-[min(50vh,420px)] min-w-0 flex-1 overflow-hidden rounded-lg bg-muted xl:min-h-0">
                  {snapshotLoading && (
                    <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
                  )}
                  {overlay ? (
                    <PlanningMapLeaflet
                      key={planningMapLeafletKey(overlay)}
                      overlay={overlay}
                      onMapClick={() => {}}
                      polygonPickMode
                      selectedRouteId={selectedMapRouteId}
                      onRouteSelect={actions.setSelectedMapRouteId}
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
                      {t("overviewEmpty")}
                    </div>
                  ) : null}
                  {overlay && repositioningDeliveryStopId ? (
                    <p className="text-muted-foreground pointer-events-none absolute bottom-2 left-2 right-2 z-[410] rounded-md border bg-background/95 px-2 py-1.5 text-center text-xs shadow-sm">
                      {tre("mapDragRepositionHint")}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-h-0 min-w-0 flex-col xl:min-h-0">
                  <PlanningMapSidebar
                    fillHeight
                    overlay={overlay}
                    polygonAlgorithm={polygonAlgorithm}
                    mapStops={mapStops}
                    routes={snapshot?.routes ?? undefined}
                    fleetVehicleIds={fleetVehicleIds}
                    fleetVehicles={vehicles ?? undefined}
                    planVehicleIds={selectedVehicleIds}
                    highlightedRouteId={selectedMapRouteId}
                    onHighlightRoute={actions.setSelectedMapRouteId}
                    canShowMap={Boolean(overlay)}
                    routeEditActive={routeEditActive}
                    isConfirmed={Boolean(planDetail?.isConfirmed)}
                    planningWindowId={planId}
                    selectedDeliveryStopId={mapSelectedDeliveryStopId}
                    onClearMapSelection={() => setMapSelectedDeliveryStopId(null)}
                    repositioningDeliveryStopId={repositioningDeliveryStopId}
                    onEditStop={setDeliveryStopEditorId}
                    onStartReposition={setRepositioningDeliveryStopId}
                    onAfterMutation={actions.refreshPlanningMapSnapshot}
                  />
                </div>
              </div>
              <p className="text-muted-foreground shrink-0 text-xs leading-snug">
                {t("confirmMapHint")} {t("polygonPickHint")} {t("routeEditHint")}
              </p>
              {planDetail?.isConfirmed ? (
                <>
                  <Badge>{t("statusConfirmed")}</Badge>
                  <p className="text-muted-foreground text-sm">
                    {t("confirmedExplain")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => actions.reopenPlan()}
                    disabled={reopenPending}
                  >
                    {reopenPending ? t("reopening") : t("reopenPlan")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    {t("confirmExplain")}
                  </p>
                  <Button
                    type="button"
                    onClick={() => actions.confirmPlan()}
                    disabled={confirmPending}
                  >
                    {confirmPending ? t("confirming") : t("confirmPlan")}
                  </Button>
                </>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm">{t("assignDriversIntro")}</p>
              <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_minmax(300px,420px)]">
                <div className="min-w-0 space-y-3">
                  <RouteDriverAssignmentList
                    routes={snapshot?.routes}
                    overlay={overlay}
                    mapStops={mapStops}
                    drivers={drivers}
                    driversLoading={driversLoading}
                    routeDriverByRouteId={routeDriverByRouteId}
                    selectedMapRouteId={selectedMapRouteId}
                    onRouteSelect={actions.setSelectedMapRouteId}
                    onRouteDriverChange={actions.setRouteDriver}
                    loading={snapshotLoading}
                  />
                  {assignRouteDriversPending ? (
                    <p className="text-muted-foreground text-xs">
                      {t("savingDriverAssignments")}
                    </p>
                  ) : null}
                </div>
                <div className="relative h-[min(50vh,400px)] min-w-0 w-full overflow-hidden rounded-lg bg-muted xl:sticky xl:top-4 xl:h-[min(70vh,560px)]">
                  {snapshotLoading ? (
                    <Skeleton className="absolute inset-0 rounded-lg" />
                  ) : overlay ? (
                    <PlanningMapLeaflet
                      key={planningMapLeafletKey(overlay)}
                      overlay={overlay}
                      onMapClick={() => {}}
                      polygonPickMode
                      selectedRouteId={selectedMapRouteId}
                      onRouteSelect={actions.setSelectedMapRouteId}
                    />
                  ) : (
                    <div className="text-muted-foreground flex size-full items-center justify-center p-4 text-center text-sm">
                      {t("noRoutesForAssignment")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-6">
              {snapshotLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : snapshot ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {t("overviewStops")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                      {snapshot.stops.length}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {t("overviewRoutes")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                      {snapshot.routes.length}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("overviewEmpty")}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => actions.exportFleetPdf()}
                  disabled={fleetPdfPending || !planId}
                >
                  {fleetPdfPending ? t("downloading") : t("fleetPdf")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => actions.exportDriversZip()}
                  disabled={driversZipPending || !planId}
                >
                  {driversZipPending ? t("downloading") : t("driversZip")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => actions.exportJson()}
                  disabled={jsonExportPending || !planId}
                >
                  {jsonExportPending ? t("downloading") : t("jsonExport")}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">{t("reportsHint")}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => actions.goBack()}
          disabled={step === 0}
        >
          <ChevronLeft className="me-1 size-4" />
          {t("back")}
        </Button>
        <Button
          type="button"
          onClick={() => void actions.goNext()}
          disabled={step >= stepsTotal - 1 || createPlanPending || assignRouteDriversPending}
        >
          {step === 0 && createPlanPending
            ? t("creatingPlan")
            : step === 5 && assignRouteDriversPending
              ? t("savingDriverAssignments")
              : step === 0 && !planId
                ? t("createPlanAndNext")
                : t("next")}
          <ChevronRight className="ms-1 size-4" />
        </Button>
      </div>

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
        defaultServiceDate={planDetail?.serviceDate ?? null}
        saving={stopEditBusy}
        onSave={(body) =>
          deliveryStopEditorId
            ? actions.updateDeliveryStop(deliveryStopEditorId, body)
            : Promise.resolve()
        }
      />

      <Dialog open={mapPickerOpen} onOpenChange={actions.setMapPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select location on map</DialogTitle>
          </DialogHeader>
          <LocationPickerLeaflet
            picked={pickedPoint}
            onPick={(lat, lng) => actions.setPickedPoint({ lat, lng })}
          />
          <p className="text-muted-foreground text-xs">
            Click map to place marker. We will fill latitude/longitude and best-effort address fields.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => actions.setMapPickerOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => actions.applyPickedPoint()}
              disabled={applyPickedPointPending || !pickedPoint}
            >
              {applyPickedPointPending ? "Applying..." : "Use selected point"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
