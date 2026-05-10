"use client";

import Link from "next/link";
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

export function DeliveriesPageView({
  viewState,
  actions,
}: DeliveriesPageViewModel) {
  const t = useTranslations("UiDeliveries");
  const tc = useTranslations("Common");
  const tm = useTranslations("UiMap");
  const {
    organizations,
    selectedOrgId,
    planningWindows,
    selectedPlanId,
    allPlansValue,
    stops,
    orgsLoading,
    planningLoading,
    stopsLoading,
    addDialogOpen,
    recipientName,
    latitude,
    longitude,
    phone,
    serviceMinutes,
    addPending,
    deletePending,
    importPending,
    draftPending,
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
            href="/planning"
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
            size="sm"
            onClick={() => actions.onPickExcel()}
            disabled={importPending || !selectedOrgId}
          >
            <Upload className="me-2 size-4" />
            {importPending ? t("importing") : t("uploadExcel")}
          </Button>
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
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-start">
                <th className="px-3 py-2 font-medium">{tm("recipientName")}</th>
                <th className="px-3 py-2 font-medium">{tc("phone")}</th>
                <th className="px-3 py-2 font-medium">{t("coordinates")}</th>
                <th className="px-3 py-2 font-medium w-[72px]" />
              </tr>
            </thead>
            <tbody>
              {stops.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.recipientName}</td>
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
                <Label htmlFor="stop-mins">{t("serviceMinutes")}</Label>
                <Input
                  id="stop-mins"
                  inputMode="numeric"
                  value={serviceMinutes}
                  onChange={(e) => actions.setServiceMinutes(e.target.value)}
                />
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
    </div>
  );
}
