"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
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
} from "@/features/map/domain/planning-map.types";
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
  const tg = useTranslations("UiGeocoding");

  const stepTitles = [
    t("steps.planDate"),
    t("steps.drivers"),
    t("steps.deliveries"),
    t("steps.preview"),
    t("steps.confirm"),
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
    assignments,
    stops,
    stopsLoading,
    snapshot,
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
    assignmentDriverId,
    assignmentVehicleId,
    assignmentFromLocal,
    selectedRouteDriverIds,
    planDetail,
    planDetailLoading,
    workPlans,
    workPlansLoading,
    selectedWorkPlanId,
    storages,
    storagesLoading,
    selectedStorageId,
    driverShiftOrdinalByDriverId,
    saveDriverShiftsPending,
    orgsLoading,
    driversLoading,
    vehiclesLoading,
    assignmentsLoading,
    createPlanPending,
    assignmentPending,
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
                <div className="space-y-2">
                  <Label htmlFor="wf-tz">{t("timeZoneRequired")}</Label>
                  <Input
                    id="wf-tz"
                    value={timeZoneId}
                    onChange={(e) => actions.setTimeZoneId(e.target.value)}
                    placeholder={t("timeZonePlaceholder")}
                  />
                </div>
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
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <Label>{t("storagePick")}</Label>
                  <Select
                    value={selectedStorageId}
                    onValueChange={(v) => actions.setSelectedStorageId(v ?? "")}
                    disabled={storagesLoading || !(storages?.length)}
                    items={(storages ?? []).map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("storagePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(storages ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!storagesLoading && !(storages?.length) ? (
                    <p className="text-destructive text-xs">{t("noStorages")}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    {t("storageHelp")}{" "}
                    <Link href="/storages" className="text-primary underline">
                      {t("manageStorages")}
                    </Link>
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => actions.createPlan()}
                  disabled={
                    createPlanPending ||
                    !selectedOrgId ||
                    !planDate ||
                    !selectedWorkPlanId.trim() ||
                    !timeZoneId.trim() ||
                    !selectedStorageId.trim() ||
                    storagesLoading
                  }
                >
                  {createPlanPending ? t("creatingPlan") : t("createPlan")}
                </Button>
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
                {t("driversIntro")}{" "}
                <Link href="/drivers" className="text-primary underline">
                  {t("openDrivers")}
                </Link>{" "}
                ·{" "}
                <Link href="/fleet" className="text-primary underline">
                  {t("openFleet")}
                </Link>
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("driver")}</Label>
                  <Select
                    value={assignmentDriverId}
                    onValueChange={(v) => actions.setAssignmentDriverId(v ?? "")}
                    disabled={driversLoading || !drivers?.length}
                    items={(drivers ?? []).map((d) => ({
                      value: d.id,
                      label: d.displayName ?? d.id,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectDriver")} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("vehicle")}</Label>
                  <Select
                    value={assignmentVehicleId}
                    onValueChange={(v) =>
                      actions.setAssignmentVehicleId(v ?? "")
                    }
                    disabled={vehiclesLoading || !vehicles?.length}
                    items={(vehicles ?? []).map((v) => ({
                      value: v.id,
                      label: v.name ?? v.id,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectVehicle")} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("effectiveFrom")}</Label>
                  <Input
                    type="datetime-local"
                    value={assignmentFromLocal}
                    onChange={(e) =>
                      actions.setAssignmentFromLocal(e.target.value)
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => actions.addAssignment()}
                disabled={
                  assignmentPending ||
                  !assignmentDriverId ||
                  !assignmentVehicleId
                }
              >
                {assignmentPending ? t("assigning") : t("assignVehicle")}
              </Button>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">{t("selectedDriversForPlan")}</h4>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => actions.selectAllRouteDrivers()}>
                      {t("selectAll")}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => actions.clearRouteDrivers()}>
                      {t("clearAll")}
                    </Button>
                  </div>
                </div>
                {assignmentsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : assignments?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {assignments.map((a) => {
                      const checked = selectedRouteDriverIds.includes(a.driverId);
                      return (
                        <label
                          key={`pick-${a.id}`}
                          className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span className="truncate">
                            {(a.driverDisplayName ?? "Driver")} → {(a.vehicleName ?? "Vehicle")}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => actions.toggleRouteDriver(a.driverId, e.target.checked)}
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("noAssignments")}</p>
                )}
              </div>
              {(planDetail?.dispatchShifts?.length ?? 0) > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{t("shiftAssignmentsTitle")}</h4>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t("shiftAssignmentsHint")}
                      </p>
                    </div>
                    {planDetailLoading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : (
                      <>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          {(planDetail?.dispatchShifts ?? []).map((s) => (
                            <li key={s.id}>
                              {t("dispatchShiftRow", {
                                ordinal: s.ordinal,
                                start: new Date(s.startsAtUtc).toLocaleString(),
                                end: new Date(s.endsAtUtc).toLocaleString(),
                              })}
                            </li>
                          ))}
                        </ul>
                        <div className="grid gap-2">
                          {(assignments ?? []).map((a) => (
                            <div
                              key={`shift-${a.id}`}
                              className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                              <span className="min-w-[140px] truncate font-medium">
                                {a.driverDisplayName ?? "—"}
                              </span>
                              <select
                                className="border-input bg-background h-9 min-w-[200px] rounded-md border px-2 text-sm"
                                value={driverShiftOrdinalByDriverId[a.driverId] ?? ""}
                                onChange={(e) =>
                                  actions.setDriverShiftOrdinal(a.driverId, e.target.value)
                                }
                              >
                                <option value="">{t("shiftPickPlaceholder")}</option>
                                {(planDetail?.dispatchShifts ?? []).map((s) => (
                                  <option key={s.ordinal} value={String(s.ordinal)}>
                                    #{s.ordinal}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            saveDriverShiftsPending ||
                            !planId ||
                            Boolean(planDetail?.isConfirmed)
                          }
                          onClick={() => actions.saveDriverShifts()}
                        >
                          {saveDriverShiftsPending
                            ? t("savingShiftAssignments")
                            : t("saveShiftAssignments")}
                        </Button>
                        {planDetail?.isConfirmed ? (
                          <p className="text-muted-foreground text-xs">{t("shiftAssignmentsLocked")}</p>
                        ) : null}
                      </>
                    )}
                  </div>
                </>
              ) : null}
              <Separator />
              <div>
                <h4 className="mb-2 font-medium">{t("currentAssignments")}</h4>
                {assignmentsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : assignments?.length ? (
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {assignments.map((a) => (
                      <li key={a.id}>
                        {a.driverDisplayName ?? "—"} →{" "}
                        {a.vehicleName ?? "—"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noAssignments")}
                  </p>
                )}
              </div>
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
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{td("planningStrategy")}</Label>
                  <Select
                    value={planningStrategy}
                    onValueChange={(v) =>
                      actions.setPlanningStrategy(
                        (v as typeof planningStrategy) ?? "SpatialCell",
                      )
                    }
                    items={planningStrategies.map((s) => ({
                      value: s,
                      label: td(`planningStrategies.${s}`),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {planningStrategies.map((s) => (
                        <SelectItem key={s} value={s}>
                          {td(`planningStrategies.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tm("regionAlgorithm")}</Label>
                  <Select
                    value={polygonAlgorithm}
                    onValueChange={(v) =>
                      actions.setPolygonAlgorithm(
                        v as PolygonRegionAlgorithm,
                      )
                    }
                    items={POLYGON_REGION_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: tm(`polygon.${opt.value}.label`),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLYGON_REGION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {tm(`polygon.${opt.value}.label`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => actions.generateDraftRoutes()}
                  disabled={
                    draftPending ||
                    planDetail?.isConfirmed ||
                    selectedRouteDriverIds.length === 0
                  }
                >
                  {draftPending ? td("generatingRoutes") : td("generateDraftRoutes")}
                </Button>
              </div>
              {planDetail?.isConfirmed ? (
                <p className="text-amber-600 text-sm">{t("lockedRegenerateHint")}</p>
              ) : null}
              <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-lg bg-muted">
                {snapshotLoading && (
                  <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
                )}
                {overlay ? (
                  <PlanningMapLeaflet
                    key={planningMapLeafletKey(overlay)}
                    overlay={overlay}
                    onMapClick={() => {}}
                  />
                ) : !snapshotLoading ? (
                  <div className="text-muted-foreground flex size-full items-center justify-center p-6 text-center text-sm">
                    {t("overviewEmpty")}
                  </div>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{t("previewHelp")}</p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{td("planningStrategy")}</Label>
                  <Select
                    value={planningStrategy}
                    onValueChange={(v) =>
                      actions.setPlanningStrategy(
                        (v as typeof planningStrategy) ?? "SpatialCell",
                      )
                    }
                    items={planningStrategies.map((s) => ({
                      value: s,
                      label: td(`planningStrategies.${s}`),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {planningStrategies.map((s) => (
                        <SelectItem key={s} value={s}>
                          {td(`planningStrategies.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tm("regionAlgorithm")}</Label>
                  <Select
                    value={polygonAlgorithm}
                    onValueChange={(v) =>
                      actions.setPolygonAlgorithm(v as PolygonRegionAlgorithm)
                    }
                    items={POLYGON_REGION_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: tm(`polygon.${opt.value}.label`),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLYGON_REGION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {tm(`polygon.${opt.value}.label`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => actions.generateDraftRoutes()}
                  disabled={
                    draftPending ||
                    planDetail?.isConfirmed ||
                    selectedRouteDriverIds.length === 0
                  }
                >
                  {draftPending ? td("generatingRoutes") : td("generateDraftRoutes")}
                </Button>
              </div>
              <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-lg bg-muted">
                {snapshotLoading && (
                  <Skeleton className="absolute inset-0 z-[400] rounded-lg" />
                )}
                {overlay ? (
                  <PlanningMapLeaflet
                    key={planningMapLeafletKey(overlay)}
                    overlay={overlay}
                    onMapClick={() => {}}
                  />
                ) : !snapshotLoading ? (
                  <div className="text-muted-foreground flex size-full items-center justify-center p-6 text-center text-sm">
                    {t("overviewEmpty")}
                  </div>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{t("confirmMapHint")}</p>
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
          onClick={() => actions.goNext()}
          disabled={step >= stepsTotal - 1}
        >
          {t("next")}
          <ChevronRight className="ms-1 size-4" />
        </Button>
      </div>

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
