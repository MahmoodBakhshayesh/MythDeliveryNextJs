"use client";

import Link from "next/link";
import { ExternalLink, FileJson } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { FleetPlansPageViewModel } from "@/features/fleet-plans/controllers/fleet-plans-page.controller";

function formatRange(startsAtUtc: string, endsAtUtc: string) {
  try {
    const s = new Date(startsAtUtc);
    const e = new Date(endsAtUtc);
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return `${startsAtUtc} → ${endsAtUtc}`;
  }
}

export function FleetPlansPageView({
  viewState,
  actions,
}: FleetPlansPageViewModel) {
  const t = useTranslations("UiFleetPlans");
  const tc = useTranslations("Common");

  const {
    organizations,
    selectedOrgId,
    planningWindows,
    orgsLoading,
    windowsLoading,
    busyPlanId,
    busyKind,
  } = viewState;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="max-w-md space-y-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("listTitle")}</CardTitle>
          <CardDescription>{t("listHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {windowsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : planningWindows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("emptyPlans")}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b text-start">
                    <th className="px-3 py-2 font-medium">{t("colPlan")}</th>
                    <th className="px-3 py-2 font-medium">{t("colWindow")}</th>
                    <th className="px-3 py-2 font-medium">{t("colStatus")}</th>
                    <th className="px-3 py-2 font-medium">{t("colReports")}</th>
                    <th className="px-3 py-2 font-medium">{t("colOpen")}</th>
                  </tr>
                </thead>
                <tbody>
                  {planningWindows.map((w) => {
                    const confirmed = Boolean(w.isConfirmed);
                    const fleetBusy =
                      busyPlanId === w.id && busyKind === "fleet";
                    const zipBusy = busyPlanId === w.id && busyKind === "zip";
                    const jsonBusy = busyPlanId === w.id && busyKind === "json";
                    return (
                      <tr key={w.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{w.name}</td>
                        <td className="text-muted-foreground max-w-[280px] px-3 py-2 whitespace-normal">
                          {formatRange(w.startsAtUtc, w.endsAtUtc)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <Badge variant={confirmed ? "default" : "secondary"}>
                              {confirmed ? t("statusConfirmed") : t("statusDraft")}
                            </Badge>
                            {confirmed && w.confirmedAtUtc ? (
                              <span className="text-muted-foreground text-xs">
                                {t("confirmedAt", {
                                  date: new Date(
                                    w.confirmedAtUtc,
                                  ).toLocaleString(),
                                })}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={fleetBusy}
                              onClick={() =>
                                actions.downloadFleetPdf(w.id)
                              }
                            >
                              {fleetBusy ? t("downloading") : t("fleetPdf")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={zipBusy}
                              onClick={() =>
                                actions.downloadDriversZip(w.id)
                              }
                            >
                              {zipBusy ? t("downloading") : t("driversZip")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={jsonBusy}
                              onClick={() => actions.exportJson(w.id)}
                            >
                              <FileJson className="me-1 size-3.5" />
                              {jsonBusy ? t("downloading") : t("jsonExport")}
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/plan-workflow?organizationId=${selectedOrgId}&planningWindowId=${w.id}`}
                              className="text-primary inline-flex items-center gap-1 text-xs underline"
                            >
                              {t("openWizard")}
                              <ExternalLink className="size-3" />
                            </Link>
                            <Link
                              href={`/map?organizationId=${selectedOrgId}&planningWindowId=${w.id}`}
                              className="text-primary inline-flex items-center gap-1 text-xs underline"
                            >
                              {t("openMap")}
                              <ExternalLink className="size-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
