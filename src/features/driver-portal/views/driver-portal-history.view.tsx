"use client";

import { ChevronDown, ChevronRight, Package, Route as RouteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverPortalHistoryViewModel } from "@/features/driver-portal/controllers/driver-portal-history.controller";
import { cn } from "@/lib/utils";

function formatRange(startsAtUtc: string, endsAtUtc: string, timeZoneId?: string) {
  try {
    const opts: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZoneId || undefined,
    };
    const a = new Date(startsAtUtc);
    const b = new Date(endsAtUtc);
    return `${a.toLocaleString(undefined, opts)} — ${b.toLocaleString(undefined, opts)}`;
  } catch {
    return `${startsAtUtc} — ${endsAtUtc}`;
  }
}

export function DriverPortalHistoryView({
  viewState,
  actions,
}: DriverPortalHistoryViewModel) {
  const t = useTranslations("UiDriverPortal");

  const routeStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return t("historyRouteDraft");
      case 1:
        return t("historyRoutePlanned");
      case 2:
        return t("historyRouteActive");
      case 3:
        return t("historyRouteCompleted");
      case 4:
        return t("historyRouteCancelled");
      default:
        return t("historyRouteUnknown", { code: status });
    }
  };

  const packageStatusLabel = (status: number | string) => {
    const n = typeof status === "string" ? Number.parseInt(status, 10) : status;
    if (Number.isNaN(n)) return String(status);
    const keys = [
      "pkgStatus0",
      "pkgStatus1",
      "pkgStatus2",
      "pkgStatus3",
      "pkgStatus4",
      "pkgStatus5",
      "pkgStatus6",
      "pkgStatus7",
      "pkgStatus8",
      "pkgStatus9",
      "pkgStatus10",
      "pkgStatus11",
      "pkgStatus12",
    ] as const;
    if (n >= 0 && n < keys.length) return t(keys[n]);
    return t("pkgStatusFallback", { code: n });
  };

  const formatHandledAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("historyTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("historySubtitle")}
        </p>
      </header>

      {viewState.windowsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : viewState.windowsError ? (
        <p className="text-destructive text-sm">
          {viewState.windowsError instanceof Error
            ? viewState.windowsError.message
            : t("historyLoadError")}
        </p>
      ) : viewState.windows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("historyEmptyTitle")}</CardTitle>
            <CardDescription>{t("historyEmptyDesc")}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {viewState.windows.map((w) => {
            const open = viewState.expandedPlanningWindowId === w.id;
            return (
              <Card key={w.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-lg leading-snug">{w.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {formatRange(w.startsAtUtc, w.endsAtUtc, w.timeZoneId)}
                      {" · "}
                      {t("historyServiceDay")}: {w.serviceDate}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {w.isConfirmed ? (
                      <Badge variant="secondary">{t("historyConfirmed")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("historyNotConfirmed")}</Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => actions.togglePlan(w.id)}
                      aria-expanded={open}
                    >
                      {open ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      )}
                      {open ? t("historyCollapse") : t("historyExpand")}
                    </Button>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="border-t pt-4 space-y-6">
                    {viewState.detailLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    ) : viewState.detailError ? (
                      <p className="text-destructive text-sm">
                        {viewState.detailError instanceof Error
                          ? viewState.detailError.message
                          : t("historyDetailError")}
                      </p>
                    ) : (
                      <>
                        <section className="space-y-2">
                          <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <RouteIcon className="size-4" />
                            {t("historyYourRoutes")}
                          </h3>
                          {!viewState.routes?.length ? (
                            <p className="text-muted-foreground text-sm">
                              {t("historyNoRoutes")}
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {viewState.routes.map((r) => (
                                <li
                                  key={r.id}
                                  className="rounded-lg border bg-muted/30 p-3 text-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {r.name?.trim() || t("historyRouteUnnamed")}
                                    </span>
                                    <Badge variant="outline">
                                      {routeStatusLabel(r.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground mt-1">
                                    {r.vehicleName?.trim() ||
                                      t("historyVehicleFallback")}
                                  </p>
                                  <p className="text-muted-foreground mt-1">
                                    {t("historyStopCount", {
                                      count: r.stops?.length ?? 0,
                                    })}
                                  </p>
                                  {r.stops?.length ? (
                                    <ol className="mt-2 list-decimal ps-5 text-muted-foreground">
                                      {r.stops
                                        .slice()
                                        .sort((a, b) => a.sequence - b.sequence)
                                        .map((s) => (
                                          <li key={s.id}>
                                            <span className="text-foreground">
                                              {s.sequence}.{" "}
                                            </span>
                                            {s.recipientName?.trim() ||
                                              t("historyStopNoName")}
                                          </li>
                                        ))}
                                    </ol>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>

                        <section className="space-y-2">
                          <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <Package className="size-4" />
                            {t("historyPackagesHandled")}
                          </h3>
                          {!viewState.packages?.length ? (
                            <p className="text-muted-foreground text-sm">
                              {t("historyNoPackages")}
                            </p>
                          ) : (
                            <div className="overflow-x-auto rounded-md border">
                              <table className="w-full min-w-[480px] text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50 text-start">
                                    <th className={cn("px-3 py-2 font-medium")}>
                                      {t("historyBarcode")}
                                    </th>
                                    <th className={cn("px-3 py-2 font-medium")}>
                                      {t("historyPkgStatus")}
                                    </th>
                                    <th className={cn("px-3 py-2 font-medium")}>
                                      {t("historyHandledAt")}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {viewState.packages.map((p) => (
                                    <tr key={p.id} className="border-b last:border-0">
                                      <td className="px-3 py-2 font-mono text-xs">
                                        {p.barcode}
                                      </td>
                                      <td className="px-3 py-2">
                                        {packageStatusLabel(p.status)}
                                      </td>
                                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                                        {formatHandledAt(p.statusChangedAtUtc)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
