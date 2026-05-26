"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverResponse } from "@/features/drivers/domain/driver.types";
import type {
  DeliveryStopResponseDto,
  MapOverlayModel,
  RouteResponseDto,
} from "@/features/map/domain/planning-map.types";
import { buildRouteAssignmentSummaries } from "@/features/plan-workflow/lib/route-assignment-summary";
import { cn } from "@/lib/utils";

export type RouteDriverAssignmentListProps = {
  routes: RouteResponseDto[] | null | undefined;
  overlay: MapOverlayModel | null | undefined;
  mapStops: DeliveryStopResponseDto[] | null | undefined;
  drivers: DriverResponse[] | null | undefined;
  driversLoading: boolean;
  routeDriverByRouteId: Record<string, string>;
  selectedMapRouteId: string | null;
  onRouteSelect: (routeId: string | null) => void;
  onRouteDriverChange: (routeId: string, driverId: string) => void;
  loading?: boolean;
};

function formatKg(kg: number): string {
  if (kg <= 0) return "—";
  return kg >= 100 ? `${kg.toFixed(0)} kg` : `${kg.toFixed(1)} kg`;
}

function formatM3(m3: number): string {
  if (m3 <= 0) return "—";
  return m3 < 10 ? `${m3.toFixed(2)} m³` : `${m3.toFixed(1)} m³`;
}

export function RouteDriverAssignmentList({
  routes,
  overlay,
  mapStops,
  drivers,
  driversLoading,
  routeDriverByRouteId,
  selectedMapRouteId,
  onRouteSelect,
  onRouteDriverChange,
  loading,
}: RouteDriverAssignmentListProps) {
  const t = useTranslations("UiPlanWorkflow");
  const tm = useTranslations("UiMap");

  const summaries = useMemo(
    () => buildRouteAssignmentSummaries(routes ?? [], overlay, mapStops),
    [routes, overlay, mapStops],
  );

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!summaries.length) {
    return (
      <p className="text-muted-foreground text-sm">{t("noRoutesForAssignment")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 px-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_auto]">
        <span>{t("assignRouteColumnRoute")}</span>
        <span className="min-w-[220px]">{t("assignRouteColumnDriver")}</span>
      </div>
      {summaries.map((row) => {
        const selected = selectedMapRouteId === row.routeId;
        return (
          <div
            key={row.routeId}
            className={cn(
              "rounded-lg border bg-card transition-colors",
              selected && "border-primary ring-2 ring-primary/25",
            )}
          >
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-start"
                onClick={() => onRouteSelect(selected ? null : row.routeId)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium leading-tight">{row.label}</p>
                    {row.routeName && row.vehicleName && row.routeName !== row.label ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {row.routeName}
                      </p>
                    ) : null}
                    <dl className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <div>
                        <dt className="sr-only">{tm("routeInsightsStops")}</dt>
                        <dd className="tabular-nums">
                          {t("assignRouteStops", { count: row.stopCount })}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">{tm("routeInsightsStraightLineKm")}</dt>
                        <dd className="tabular-nums">
                          {row.pathKm.toFixed(1)} km
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">{tm("routeInsightsDurationEstimate")}</dt>
                        <dd className="tabular-nums">
                          ~{row.estMinutes} {tm("routeInsightsMinutesAbbr")}
                        </dd>
                      </div>
                      {row.regionKm2 != null ? (
                        <div>
                          <dt className="sr-only">{tm("routeInsightsHullAreaKm2")}</dt>
                          <dd className="tabular-nums">
                            {row.regionKm2.toFixed(1)} km²
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="sr-only">{t("assignRouteLoad")}</dt>
                        <dd className="tabular-nums">
                          {formatKg(row.totalWeightKg)} · {formatM3(row.totalVolumeM3)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </button>
              <div className="w-full shrink-0 sm:w-[min(100%,240px)]">
                <Select
                  value={routeDriverByRouteId[row.routeId] ?? ""}
                  onValueChange={(v) => onRouteDriverChange(row.routeId, v ?? "")}
                  disabled={driversLoading || !drivers?.length}
                  items={(drivers ?? []).map((d) => ({
                    value: d.id,
                    label: d.displayName ?? d.id,
                  }))}
                >
                  <SelectTrigger className="w-full">
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
            </div>
          </div>
        );
      })}
      <p className="text-muted-foreground text-xs leading-snug">
        {t("assignDriversMetricsFootnote")}
      </p>
    </div>
  );
}
