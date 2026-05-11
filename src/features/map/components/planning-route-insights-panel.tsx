"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  MapOverlayModel,
  PolygonRegionAlgorithm,
} from "@/features/map/domain/planning-map.types";
import {
  estimateDrivePlusServiceMinutes,
  polylineLengthKm,
  ringAreaKm2,
} from "@/features/map/lib/route-metrics";

export type PlanningRouteInsightsPanelProps = {
  overlay: MapOverlayModel;
  polygonAlgorithm: PolygonRegionAlgorithm;
};

export function PlanningRouteInsightsPanel({
  overlay,
  polygonAlgorithm,
}: PlanningRouteInsightsPanelProps) {
  const t = useTranslations("UiMap");
  const [routeId, setRouteId] = useState(overlay.routes[0]?.routeId ?? "");

  useEffect(() => {
    if (!overlay.routes.some((r) => r.routeId === routeId)) {
      setRouteId(overlay.routes[0]?.routeId ?? "");
    }
  }, [overlay.routes, routeId]);

  const layer = useMemo(
    () => overlay.routes.find((r) => r.routeId === routeId) ?? null,
    [overlay.routes, routeId],
  );

  const straightKm = layer ? polylineLengthKm(layer.polyline) : 0;
  const stops = layer?.polyline.length ?? 0;
  const areaKm2 = layer?.hull ? ringAreaKm2(layer.hull) : null;
  const estMin =
    layer && stops > 0
      ? estimateDrivePlusServiceMinutes(straightKm, stops)
      : 0;

  if (!overlay.routes.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("routeInsightsTitle")}</CardTitle>
        <CardDescription>{t("routeInsightsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>{t("routeInsightsSelectRoute")}</Label>
          <Select
            value={routeId}
            onValueChange={(v) => {
              if (v) setRouteId(v);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {overlay.routes.map((r) => (
                <SelectItem key={r.routeId} value={r.routeId}>
                  {r.driverName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {layer ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{t("routeInsightsStops")}</dt>
            <dd className="font-medium tabular-nums">{stops}</dd>
            <dt className="text-muted-foreground">
              {t("routeInsightsStraightLineKm")}
            </dt>
            <dd className="font-medium tabular-nums">
              {straightKm.toFixed(2)} km
            </dd>
            <dt className="text-muted-foreground">
              {t("routeInsightsHullAreaKm2")}
            </dt>
            <dd className="font-medium tabular-nums">
              {areaKm2 != null ? `${areaKm2.toFixed(2)} km²` : "—"}
            </dd>
            <dt className="text-muted-foreground">
              {t("routeInsightsDurationEstimate")}
            </dt>
            <dd className="font-medium tabular-nums">
              ~{estMin} {t("routeInsightsMinutesAbbr")}
            </dd>
          </dl>
        ) : null}
        <p className="text-muted-foreground text-xs leading-snug">
          {t("routeInsightsFootnote", {
            algorithm: t(`polygon.${polygonAlgorithm}.label`),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
