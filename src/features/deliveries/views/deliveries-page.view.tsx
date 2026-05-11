"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Download, Plus, Route, Trash2, Upload } from "lucide-react";
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
import type { DeliveriesPageViewModel } from "@/features/deliveries/controllers/deliveries-page.controller";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const LocationPickerLeaflet = dynamic(
  () =>
    import("@/features/map/components/location-picker-leaflet").then(
      (m) => m.LocationPickerLeaflet,
    ),
  { ssr: false },
);

export function DeliveriesPageView({
  viewState,
  actions,
}: DeliveriesPageViewModel) {
  const t = useTranslations("UiDeliveries");
  const tc = useTranslations("Common");
  const tm = useTranslations("UiMap");
  const tg = useTranslations("UiGeocoding");
  const {
    organizations,
    selectedOrgId,
    planningWindows,
    selectedPlanId,
    allPlansValue,
    stops,
    filteredStops,
    selectedOrderFilter,
    orgsLoading,
    planningLoading,
    stopsLoading,
    addDialogOpen,
    mapPickerOpen,
    pickedPoint,
    recipientName,
    orderId,
    latitude,
    longitude,
    addressLine1,
    city,
    region,
    postalCode,
    country,
    phone,
    timeSection,
    notes,
    externalRef,
    itemSku,
    itemDescription,
    itemQuantity,
    itemWeightKg,
    itemVolumeM3,
    timeSections,
    planningStrategy,
    planningStrategies,
    replaceExistingOrderIdsOnImport,
    isAdmin,
    addPending,
    deletePending,
    deleteAllPending,
    importPending,
    draftPending,
    exportPending,
    fleetPdfPending,
    reverseGeocodePending,
    geocodeSearchPending,
    applyPickedPointPending,
    driversZipPending,
    deletePlanPending,
    lastImport,
    fileInputRef,
  } = viewState;

  const selectorsBusy = orgsLoading || planningLoading;
  const loading = selectorsBusy || stopsLoading;
  const hasSpecificPlan = selectedPlanId !== allPlansValue;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("subtitle")}{" "}
            <code className="rounded bg-muted px-1">
              GET /api/deliverystops?organizationId=
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/fleet-plans"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            {t("managePlans")}
          </Link>
          <Button type="button" onClick={() => actions.openAddDialog()}>
            <Plus className="me-2 size-4" />
            {t("addStop")}
          </Button>
        </div>
      </div>

      <div className="flex max-w-3xl flex-col gap-4 sm:flex-row">
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
          <Label>{t("planFilter")}</Label>
          <Select
            value={selectedPlanId}
            onValueChange={(v) =>
              actions.setSelectedPlanId(v ?? allPlansValue)
            }
            disabled={selectorsBusy}
            items={[
              { value: allPlansValue, label: t("allPlans") },
              ...(planningWindows ?? []).map((w) => ({
                value: w.id,
                label: w.name,
              })),
            ]}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("planPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allPlansValue}>{t("allPlans")}</SelectItem>
              {planningWindows?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("excelTitle")}</CardTitle>
          <CardDescription>{t("excelDesc")}</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void actions.downloadTemplate()}
          >
            <Download className="me-2 size-4" />
            {t("downloadTemplate")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void actions.downloadImportSchemaExcel()}
            disabled={!selectedOrgId}
          >
            <Download className="me-2 size-4" />
            Export import-schema Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void actions.downloadDeliveriesExcel()}
            disabled={!selectedOrgId}
          >
            <Download className="me-2 size-4" />
            Export full deliveries Excel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => actions.onPickExcel()}
            disabled={importPending || !selectedOrgId}
          >
            <Upload className="me-2 size-4" />
            {importPending ? t("importing") : t("uploadExcel")}
          </Button>
          <label className="ms-1 inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={replaceExistingOrderIdsOnImport}
              onChange={(e) =>
                actions.setReplaceExistingOrderIdsOnImport(e.target.checked)
              }
            />
            Replace existing same OrderId on import
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={actions.onFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => actions.generateDraftRoutes()}
            disabled={draftPending || !hasSpecificPlan}
          >
            <Route className="me-2 size-4" />
            {draftPending ? t("generatingRoutes") : t("generateDraftRoutes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.exportDriverInstructions()}
            disabled={exportPending || !hasSpecificPlan}
          >
            <Download className="me-2 size-4" />
            {exportPending ? "Exporting..." : "Export driver instructions"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.exportFleetPdf()}
            disabled={fleetPdfPending || !hasSpecificPlan}
          >
            <Download className="me-2 size-4" />
            {fleetPdfPending ? "Downloading..." : "Fleet PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.exportDriversZip()}
            disabled={driversZipPending || !hasSpecificPlan}
          >
            <Download className="me-2 size-4" />
            {driversZipPending ? "Downloading..." : "Driver PDFs (ZIP)"}
          </Button>
          <div className="min-w-[210px]">
            <Select
              value={planningStrategy}
              onValueChange={(v) =>
                actions.setPlanningStrategy((v as typeof planningStrategy) ?? "SpatialCell")
              }
              items={planningStrategies.map((s) => ({
                value: s,
                label: t(`planningStrategies.${s}`),
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("planningStrategy")} />
              </SelectTrigger>
              <SelectContent>
                {planningStrategies.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`planningStrategies.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => actions.deleteSelectedPlan()}
            disabled={deletePlanPending || !hasSpecificPlan}
          >
            <Trash2 className="me-2 size-4" />
            {deletePlanPending ? t("deletingPlan") : t("deleteSelectedPlan")}
          </Button>
          {isAdmin ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => actions.deleteAllStops()}
              disabled={deleteAllPending || !stops?.length}
            >
              <Trash2 className="me-2 size-4" />
              {deleteAllPending ? t("deletingAll") : t("deleteAll")}
            </Button>
          ) : null}
        </div>
        {!planningWindows?.length ? (
          <p className="text-muted-foreground px-6 pb-6 text-sm">
            {t("noPlansHint")}
          </p>
        ) : null}
        {lastImport ? (
          <div className="text-muted-foreground border-t px-6 py-3 text-sm">
            <p>
              {t("lastImportLabel")}: {lastImport.originalFileName} —{" "}
              {lastImport.importedRows} / {lastImport.totalRows}{" "}
              {t("rowsImported")}
            </p>
            {lastImport.errorSummary ? (
              <p className="text-destructive mt-1">{lastImport.errorSummary}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : stops?.length ? (
        <div className="overflow-hidden rounded-lg border">
          {selectedOrderFilter ? (
            <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2 text-xs">
              <span>Filtered by Order ID: <strong>{selectedOrderFilter}</strong></span>
              <Button type="button" variant="ghost" size="sm" onClick={() => actions.clearOrderFilter()}>
                Clear
              </Button>
            </div>
          ) : null}
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-start">
                <th className="px-3 py-2 font-medium">{tm("recipientName")}</th>
                <th className="px-3 py-2 font-medium">Order ID</th>
                <th className="px-3 py-2 font-medium">{tc("phone")}</th>
                <th className="px-3 py-2 font-medium">{t("coordinates")}</th>
                <th className="px-3 py-2 font-medium w-[72px]" />
              </tr>
            </thead>
            <tbody>
              {filteredStops.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.recipientName}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {s.orderId ? (
                      <button
                        type="button"
                        onClick={() =>
                          actions.setSelectedOrderFilter(
                            selectedOrderFilter === s.orderId ? null : (s.orderId ?? null),
                          )
                        }
                        className={cn(
                          "rounded px-2 py-0.5 text-xs underline-offset-2 hover:underline",
                          selectedOrderFilter === s.orderId ? "bg-primary/10 text-primary font-semibold" : "bg-muted",
                        )}
                      >
                        {s.orderId}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {s.phone ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("deleteStop")}
                        disabled={deletePending}
                        onClick={() => actions.deleteStop(s.id)}
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

      <Dialog open={addDialogOpen} onOpenChange={actions.setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addStopTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-muted-foreground text-xs">
              {hasSpecificPlan
                ? t("attachToPlanHint")
                : t("noPlanAttachHint")}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="stop-name">{tm("recipientName")}</Label>
              <Input
                id="stop-name"
                value={recipientName}
                onChange={(e) => actions.setRecipientName(e.target.value)}
                placeholder={tm("recipientPlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stop-order-id">Order ID</Label>
              <Input
                id="stop-order-id"
                value={orderId}
                onChange={(e) => actions.setOrderId(e.target.value)}
                placeholder="ORD-1001"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stop-lat">{t("latitude")}</Label>
                <Input
                  id="stop-lat"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => actions.setLatitude(e.target.value)}
                  placeholder="35.6892"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stop-lng">{t("longitude")}</Label>
                <Input
                  id="stop-lng"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => actions.setLongitude(e.target.value)}
                  placeholder="51.3890"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="stop-address">{t("addressLine1")}</Label>
                  <Input
                    id="stop-address"
                    value={addressLine1}
                    onChange={(e) => actions.setAddressLine1(e.target.value)}
                    placeholder={tg("addressPlaceholder")}
                    autoComplete="street-address"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={
                    geocodeSearchPending ||
                    !addressLine1.trim()
                  }
                  onClick={() => actions.lookupCoordinatesFromAddress()}
                >
                  {geocodeSearchPending ? tg("searching") : t("findCoordinates")}
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
                  : t("lookupAddressFromCoords")}
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
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stop-city">City</Label>
                <Input
                  id="stop-city"
                  value={city}
                  onChange={(e) => actions.setCity(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stop-region">Region/State</Label>
                <Input
                  id="stop-region"
                  value={region}
                  onChange={(e) => actions.setRegion(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stop-postal">Postal code</Label>
                <Input
                  id="stop-postal"
                  value={postalCode}
                  onChange={(e) => actions.setPostalCode(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stop-country">Country</Label>
                <Input
                  id="stop-country"
                  value={country}
                  onChange={(e) => actions.setCountry(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Time section (optional)</Label>
              <Select
                value={timeSection}
                onValueChange={(v) => actions.setTimeSection(v ?? "")}
                items={timeSections.map((s) => ({
                  value: String(s.value),
                  label: s.label,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {timeSections.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stop-phone">{tc("phone")}</Label>
                <Input
                  id="stop-phone"
                  value={phone}
                  onChange={(e) => actions.setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stop-external-ref">External ref</Label>
                <Input
                  id="stop-external-ref"
                  value={externalRef}
                  onChange={(e) => actions.setExternalRef(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stop-notes">Notes</Label>
              <Input
                id="stop-notes"
                value={notes}
                onChange={(e) => actions.setNotes(e.target.value)}
              />
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-3 text-sm font-medium">Item details (Excel-compatible row)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="item-sku">SKU</Label>
                  <Input
                    id="item-sku"
                    value={itemSku}
                    onChange={(e) => actions.setItemSku(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-description">Description</Label>
                  <Input
                    id="item-description"
                    value={itemDescription}
                    onChange={(e) => actions.setItemDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="item-quantity">Quantity *</Label>
                  <Input
                    id="item-quantity"
                    inputMode="decimal"
                    value={itemQuantity}
                    onChange={(e) => actions.setItemQuantity(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-weight">Weight (kg)</Label>
                  <Input
                    id="item-weight"
                    inputMode="decimal"
                    value={itemWeightKg}
                    onChange={(e) => actions.setItemWeightKg(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-volume">Volume (m3)</Label>
                  <Input
                    id="item-volume"
                    inputMode="decimal"
                    value={itemVolumeM3}
                    onChange={(e) => actions.setItemVolumeM3(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
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
              {addPending ? tc("creating") : tm("addStop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
