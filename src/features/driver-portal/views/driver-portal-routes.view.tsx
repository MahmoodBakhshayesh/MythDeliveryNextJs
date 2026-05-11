"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverPortalRoutesViewModel } from "@/features/driver-portal/controllers/driver-portal-routes.controller";
import { formatDriverPortalRouteStatus } from "@/features/driver-portal/lib/portal-status-labels";
import { cn } from "@/lib/utils";

export function DriverPortalRoutesView({
  viewState,
  actions,
}: DriverPortalRoutesViewModel) {
  const t = useTranslations("UiDriverPortal");
  const tc = useTranslations("Common");

  const routeStatusLabel = (status: number) =>
    formatDriverPortalRouteStatus(status, t);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("routesPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("routesPageSubtitle")}
        </p>
      </header>

      <div className="max-w-md space-y-2">
        <Label>{t("routesFilterLabel")}</Label>
        <Select
          value={viewState.planningWindowFilter || "__all__"}
          onValueChange={(v) =>
            actions.setPlanningWindowFilter(
              !v || v === "__all__" ? "" : v,
            )
          }
          disabled={viewState.windowsLoading || !viewState.windows?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("routesFilterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("routesFilterAll")}</SelectItem>
            {(viewState.windows ?? []).map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name} · {w.serviceDate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewState.routesLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : viewState.routesError ? (
        <p className="text-destructive text-sm">
          {viewState.routesError instanceof Error
            ? viewState.routesError.message
            : t("routesLoadError")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-start">
                <th className={cn("px-3 py-2 font-medium")}>{tc("name")}</th>
                <th className={cn("px-3 py-2 font-medium")}>{tc("status")}</th>
                <th className={cn("px-3 py-2 font-medium")}>
                  {t("routesColVehicle")}
                </th>
                <th className={cn("px-3 py-2 font-medium")}>
                  {t("routesColStops")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(viewState.routes ?? []).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">
                    {r.name?.trim() || t("historyRouteUnnamed")}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{routeStatusLabel(r.status)}</Badge>
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {r.vehicleName?.trim() || "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {r.stops?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!viewState.routesLoading &&
      !viewState.routesError &&
      viewState.routes?.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("routesEmpty")}</p>
      ) : null}
    </div>
  );
}
