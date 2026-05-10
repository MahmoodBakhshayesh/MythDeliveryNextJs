"use client";

import Link from "next/link";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
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
import type { PlanningPageViewModel } from "@/features/planning/controllers/planning-page.controller";
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

function formatWindowRange(startsAtUtc: string, endsAtUtc: string) {
  try {
    const s = new Date(startsAtUtc);
    const e = new Date(endsAtUtc);
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return `${startsAtUtc} → ${endsAtUtc}`;
  }
}

export function PlanningPageView({ viewState, actions }: PlanningPageViewModel) {
  const t = useTranslations("UiPlanning");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    planningWindows,
    orgsLoading,
    windowsLoading,
    dialogOpen,
    editing,
    planName,
    startsAtLocal,
    endsAtLocal,
    timeZoneId,
    planningStrategy,
    polygonAlgorithm,
    savePending,
    deletePending,
    confirmPending,
    reopenPending,
  } = viewState;

  const loading = orgsLoading || windowsLoading;

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
              GET /api/planningwindows?organizationId=
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/deliveries"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            {t("openDeliveries")}
          </Link>
          <Button
            type="button"
            onClick={() => actions.openCreate()}
            disabled={!organizations?.length}
          >
            <CalendarPlus className="me-2 size-4" />
            {t("addPlan")}
          </Button>
        </div>
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

      <div className="max-w-md space-y-2">
        <Label>Planning strategy</Label>
        <Select
          value={planningStrategy}
          onValueChange={(v) => actions.setPlanningStrategy(v as typeof planningStrategy)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SpatialCell">Spatial cell</SelectItem>
            <SelectItem value="LatitudeBands">Latitude bands</SelectItem>
            <SelectItem value="LongitudeBands">Longitude bands</SelectItem>
            <SelectItem value="RadialFromCentroid">Radial from centroid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-w-md space-y-2">
        <Label>Polygon structure</Label>
        <Select
          value={polygonAlgorithm}
          onValueChange={(v) => actions.setPolygonAlgorithm(v as typeof polygonAlgorithm)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select polygon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="convexHull">Convex hull</SelectItem>
            <SelectItem value="concaveHull">Concave hull</SelectItem>
            <SelectItem value="boundingBox">Bounding box</SelectItem>
            <SelectItem value="none">No polygon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : planningWindows?.length ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-start">
                <th className="px-3 py-2 font-medium">{tc("name")}</th>
                <th className="px-3 py-2 font-medium">{t("window")}</th>
                <th className="px-3 py-2 font-medium w-[320px]" />
              </tr>
            </thead>
            <tbody>
              {planningWindows.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    {formatWindowRange(w.startsAtUtc, w.endsAtUtc)}
                    {w.isConfirmed ? (
                      <div className="mt-1 text-emerald-600">
                        Confirmed ({w.confirmedStrategy ?? "strategy n/a"})
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/map?organizationId=${selectedOrgId}&planningWindowId=${w.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Preview map
                      </Link>
                      <Link
                        href={`/deliveries?organizationId=${selectedOrgId}&planningWindowId=${w.id}&strategy=${planningStrategy}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Confirm & export
                      </Link>
                      {w.isConfirmed ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={reopenPending}
                          onClick={() => actions.reopenPlan(w.id)}
                        >
                          Re-open
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={confirmPending}
                          onClick={() => actions.confirmPlan(w.id)}
                        >
                          Confirm
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tc("edit")}
                        onClick={() => actions.openEdit(w)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("delete")}
                        disabled={deletePending}
                        onClick={() => actions.deletePlan(w.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editPlan") : t("addPlan")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">{tc("name")}</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => actions.setPlanName(e.target.value)}
                placeholder={t("planNamePlaceholder")}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="plan-start">{t("startsAt")}</Label>
                <Input
                  id="plan-start"
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={(e) => actions.setStartsAtLocal(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-end">{t("endsAt")}</Label>
                <Input
                  id="plan-end"
                  type="datetime-local"
                  value={endsAtLocal}
                  onChange={(e) => actions.setEndsAtLocal(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-tz">{t("timeZone")}</Label>
              <Input
                id="plan-tz"
                value={timeZoneId}
                onChange={(e) => actions.setTimeZoneId(e.target.value)}
                placeholder={t("timeZonePlaceholder")}
              />
            </div>
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
