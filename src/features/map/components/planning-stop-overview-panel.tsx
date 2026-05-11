"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DeliveryStopResponseDto,
  RouteResponseDto,
} from "@/features/map/domain/planning-map.types";
import { haversineKm } from "@/features/map/lib/route-metrics";

function findVisitChain(stopId: string, routes: RouteResponseDto[]) {
  for (const route of routes) {
    const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    const idx = sorted.findIndex((rs) => rs.deliveryStopId === stopId);
    if (idx < 0) continue;
    const cur = sorted[idx]!;
    const prev = idx > 0 ? sorted[idx - 1]! : null;
    const next = idx < sorted.length - 1 ? sorted[idx + 1]! : null;
    return { route, cur, prev, next };
  }
  return null;
}

export type PlanningStopOverviewPanelProps = {
  selectedDeliveryStopId: string | null;
  stops: DeliveryStopResponseDto[] | null | undefined;
  routes: RouteResponseDto[] | null | undefined;
  routeEditActive: boolean;
  isConfirmed: boolean;
  repositioningDeliveryStopId: string | null;
  onEditStop: (deliveryStopId: string) => void;
  onStartReposition: (deliveryStopId: string) => void;
};

export function PlanningStopOverviewPanel({
  selectedDeliveryStopId,
  stops,
  routes,
  routeEditActive,
  isConfirmed,
  repositioningDeliveryStopId,
  onEditStop,
  onStartReposition,
}: PlanningStopOverviewPanelProps) {
  const t = useTranslations("UiMap");
  const tc = useTranslations("Common");
  const tre = useTranslations("UiRouteEdit");

  const stop = useMemo(
    () =>
      selectedDeliveryStopId && stops?.length
        ? (stops.find((s) => s.id === selectedDeliveryStopId) ?? null)
        : null,
    [selectedDeliveryStopId, stops],
  );

  const chain = useMemo(() => {
    if (!stop || !routes?.length) return null;
    return findVisitChain(stop.id, routes);
  }, [stop, routes]);

  const legPrevKm =
    chain?.prev != null
      ? haversineKm(
          [chain.prev.latitude, chain.prev.longitude],
          [chain.cur.latitude, chain.cur.longitude],
        )
      : null;
  const legNextKm =
    chain?.next != null
      ? haversineKm(
          [chain.cur.latitude, chain.cur.longitude],
          [chain.next.latitude, chain.next.longitude],
        )
      : null;

  const hint = (() => {
    if (isConfirmed) return t("stopOverviewLockedHint");
    if (!routes?.length) return t("stopOverviewNoRoutesHint");
    return t("stopOverviewHintSelect");
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("stopOverviewTitle")}</CardTitle>
        <CardDescription>{t("stopOverviewDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!stop ? (
          <p className="text-muted-foreground text-sm leading-snug">{hint}</p>
        ) : (
          <>
            <div>
              <p className="font-medium leading-snug">{stop.recipientName}</p>
              {stop.addressLine1 ? (
                <p className="text-muted-foreground mt-1 text-sm leading-snug">
                  {stop.addressLine1}
                  {stop.city ? `, ${stop.city}` : null}
                </p>
              ) : null}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {stop.orderId ? (
                <>
                  <dt className="text-muted-foreground">
                    {t("stopOverviewOrderId")}
                  </dt>
                  <dd className="font-mono text-xs">{stop.orderId}</dd>
                </>
              ) : null}
              {stop.phone ? (
                <>
                  <dt className="text-muted-foreground">{tc("phone")}</dt>
                  <dd>{stop.phone}</dd>
                </>
              ) : null}
              {chain ? (
                <>
                  <dt className="text-muted-foreground">
                    {t("stopOverviewRoute")}
                  </dt>
                  <dd className="leading-snug">
                    {chain.route.driverName?.trim() || "—"}
                  </dd>
                  <dt className="text-muted-foreground">
                    {t("stopOverviewSequence")}
                  </dt>
                  <dd className="tabular-nums">
                    {chain.cur.sequence} / {chain.route.stops.length}
                  </dd>
                  {legPrevKm != null ? (
                    <>
                      <dt className="text-muted-foreground">
                        {t("stopOverviewLegFromPrev")}
                      </dt>
                      <dd className="tabular-nums">
                        {legPrevKm.toFixed(2)} km
                      </dd>
                    </>
                  ) : null}
                  {legNextKm != null ? (
                    <>
                      <dt className="text-muted-foreground">
                        {t("stopOverviewLegToNext")}
                      </dt>
                      <dd className="tabular-nums">
                        {legNextKm.toFixed(2)} km
                      </dd>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <dt className="text-muted-foreground">
                    {t("stopOverviewRoute")}
                  </dt>
                  <dd className="text-muted-foreground text-sm">
                    {t("stopOverviewUnassigned")}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">
                {t("stopOverviewCoordinates")}
              </dt>
              <dd className="font-mono text-xs tabular-nums">
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
              </dd>
            </dl>
            {routeEditActive && !isConfirmed && chain ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEditStop(stop.id)}
                  disabled={Boolean(repositioningDeliveryStopId)}
                >
                  {tc("edit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => onStartReposition(stop.id)}
                  disabled={repositioningDeliveryStopId === stop.id}
                >
                  <MapPin className="size-3.5" />
                  {tre("stopPopupDragOnMap")}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
