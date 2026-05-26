"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RouteResponseDto } from "@/features/map/domain/planning-map.types";
import {
  maxProximityPartCount,
  vehicleLabelForId,
  vehiclesAvailableForProximitySplit,
} from "@/features/map/lib/proximity-split-limits";
import { planningRouteEditsRepository } from "@/features/map/repositories/planning-route-edits.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import { cn } from "@/lib/utils";

type VisitOption = {
  routeStopId: string;
  deliveryStopId: string;
  routeId: string;
  label: string;
  sequence: number;
  stopsOnRoute: number;
};

function structuralRoutes(routes: RouteResponseDto[]) {
  return routes.filter((r) => r.status !== 4);
}

function routeLabel(r: RouteResponseDto, vehicleFallback: string) {
  return (
    r.vehicleName?.trim() ||
    r.name?.trim() ||
    r.driverName?.trim() ||
    vehicleFallback
  );
}

function buildVisitOptions(
  routes: RouteResponseDto[],
  vehicleFallback: string,
): VisitOption[] {
  const rows: VisitOption[] = [];
  for (const r of routes) {
    const routeName = routeLabel(r, vehicleFallback);
    const sorted = [...r.stops].sort((a, b) => a.sequence - b.sequence);
    const stopsOnRoute = sorted.length;
    for (const rs of sorted) {
      const name = rs.recipientName?.trim() || "Stop";
      rows.push({
        routeStopId: rs.id,
        deliveryStopId: rs.deliveryStopId,
        routeId: r.id,
        label: `${routeName} · #${rs.sequence} · ${name}`,
        sequence: rs.sequence,
        stopsOnRoute,
      });
    }
  }
  return rows;
}

export type PlanningRouteEditPanelProps = {
  planningWindowId: string;
  isConfirmed: boolean;
  routes: RouteResponseDto[];
  /** Map-selected route (pre-fills proximity split). */
  highlightedRouteId?: string | null;
  selectedDeliveryStopId: string | null;
  onClearSelection: () => void;
  onAfterMutation: () => Promise<void>;
  /** Renders without outer card chrome (wizard sidebar). */
  embedded?: boolean;
  /** All active fleet vehicles for the organization. */
  fleetVehicleIds?: string[];
  fleetVehicles?: { id: string; name?: string | null }[];
  /** Vehicles currently selected in plan wizard step 2. */
  planVehicleIds?: string[];
};

export function PlanningRouteEditPanel({
  planningWindowId,
  isConfirmed,
  routes,
  highlightedRouteId,
  selectedDeliveryStopId,
  onClearSelection,
  onAfterMutation,
  embedded = false,
  fleetVehicleIds = [],
  fleetVehicles,
  planVehicleIds = [],
}: PlanningRouteEditPanelProps) {
  const t = useTranslations("UiRouteEdit");
  const [visitKey, setVisitKey] = useState("");
  const [targetRouteId, setTargetRouteId] = useState("");
  const [mergeSourceRouteId, setMergeSourceRouteId] = useState("");
  const [mergeTargetRouteId, setMergeTargetRouteId] = useState("");
  const [mergeResultVehicleId, setMergeResultVehicleId] = useState("");
  const [splitVisitKey, setSplitVisitKey] = useState("");
  const [splitNewRouteVehicleId, setSplitNewRouteVehicleId] = useState("");
  const [proximityRouteId, setProximityRouteId] = useState("");
  const [proximityPartCount, setProximityPartCount] = useState("2");

  const editableRoutes = useMemo(() => structuralRoutes(routes), [routes]);
  const vehicleChoices = useMemo(() => {
    const byId = new Map<string, string>();
    for (const r of editableRoutes) {
      if (!r.vehicleId || byId.has(r.vehicleId)) continue;
      byId.set(r.vehicleId, routeLabel(r, t("vehicleFallback")));
    }
    return [...byId.entries()]
      .map(([vehicleId, displayName]) => ({ vehicleId, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [editableRoutes, t]);

  const visits = useMemo(
    () => buildVisitOptions(editableRoutes, t("vehicleFallback")),
    [editableRoutes, t],
  );
  const splitVisitOptions = useMemo(
    () =>
      visits.filter((v) => v.sequence > 1 && v.sequence < v.stopsOnRoute),
    [visits],
  );

  useEffect(() => {
    if (visitKey && !visits.some((v) => v.routeStopId === visitKey)) setVisitKey("");
  }, [visits, visitKey]);

  useEffect(() => {
    if (mergeSourceRouteId && !editableRoutes.some((r) => r.id === mergeSourceRouteId))
      setMergeSourceRouteId("");
    if (mergeTargetRouteId && !editableRoutes.some((r) => r.id === mergeTargetRouteId))
      setMergeTargetRouteId("");
  }, [editableRoutes, mergeSourceRouteId, mergeTargetRouteId]);

  useEffect(() => {
    if (!mergeTargetRouteId) return;
    const tr = editableRoutes.find((r) => r.id === mergeTargetRouteId);
    if (tr?.vehicleId) setMergeResultVehicleId(tr.vehicleId);
  }, [mergeTargetRouteId, editableRoutes]);

  useEffect(() => {
    if (splitVisitKey && !splitVisitOptions.some((v) => v.routeStopId === splitVisitKey))
      setSplitVisitKey("");
  }, [splitVisitOptions, splitVisitKey]);

  useEffect(() => {
    if (!splitVisitKey) return;
    const v = splitVisitOptions.find((x) => x.routeStopId === splitVisitKey);
    const route = v ? editableRoutes.find((r) => r.id === v.routeId) : null;
    if (route?.vehicleId) setSplitNewRouteVehicleId(route.vehicleId);
  }, [splitVisitKey, splitVisitOptions, editableRoutes]);

  useEffect(() => {
    if (!highlightedRouteId) return;
    if (!editableRoutes.some((r) => r.id === highlightedRouteId)) return;
    setProximityRouteId(highlightedRouteId);
  }, [highlightedRouteId, editableRoutes]);

  const proximityRoute = useMemo(
    () => editableRoutes.find((r) => r.id === proximityRouteId) ?? null,
    [editableRoutes, proximityRouteId],
  );

  const proximityAvailableVehicleIds = useMemo(() => {
    if (!proximityRouteId) return [];
    return vehiclesAvailableForProximitySplit(
      proximityRouteId,
      routes,
      fleetVehicleIds,
      planVehicleIds,
    );
  }, [proximityRouteId, routes, fleetVehicleIds, planVehicleIds]);

  const proximityMaxParts = proximityRoute
    ? maxProximityPartCount(proximityRoute.stops.length, proximityAvailableVehicleIds)
    : 0;

  const proximityPartCountNum = Number.parseInt(proximityPartCount, 10);
  const proximityPartCountValid =
    proximityMaxParts >= 2 &&
    Number.isFinite(proximityPartCountNum) &&
    proximityPartCountNum >= 2 &&
    proximityPartCountNum <= proximityMaxParts;

  useEffect(() => {
    if (!proximityRouteId || proximityMaxParts < 2) return;
    const parsed = Number.parseInt(proximityPartCount, 10);
    if (!Number.isFinite(parsed) || parsed < 2 || parsed > proximityMaxParts) {
      setProximityPartCount(String(Math.min(2, proximityMaxParts)));
    }
  }, [proximityRouteId, proximityMaxParts, proximityPartCount]);

  const selectedFromMap = useMemo(() => {
    if (!selectedDeliveryStopId) return null;
    return visits.find((v) => v.deliveryStopId === selectedDeliveryStopId) ?? null;
  }, [visits, selectedDeliveryStopId]);

  const effectiveVisit = useMemo(() => {
    if (visitKey) {
      const v = visits.find((x) => x.routeStopId === visitKey);
      if (v) return v;
    }
    return selectedFromMap;
  }, [visitKey, visits, selectedFromMap]);

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveVisit) throw new Error(t("pickVisit"));
      if (!targetRouteId || targetRouteId === effectiveVisit.routeId) {
        throw new Error(t("pickDifferentTargetRoute"));
      }
      const res = await planningRouteEditsRepository.moveStop(planningWindowId, {
        routeStopId: effectiveVisit.routeStopId,
        targetRouteId,
      });
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("moveSuccess"));
      setVisitKey("");
      setTargetRouteId("");
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("moveError")),
  });

  const splitMutation = useMutation({
    mutationFn: async () => {
      if (!splitVisitKey) throw new Error(t("splitPickVisit"));
      if (!splitNewRouteVehicleId) throw new Error(t("splitPickVehicle"));
      const res = await planningRouteEditsRepository.splitRoute(planningWindowId, {
        splitBeforeRouteStopId: splitVisitKey,
        newRouteVehicleId: splitNewRouteVehicleId,
      });
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("splitSuccess"));
      setSplitVisitKey("");
      setSplitNewRouteVehicleId("");
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("splitError")),
  });

  const proximitySplitMutation = useMutation({
    mutationFn: async () => {
      if (!proximityRouteId) throw new Error(t("proximityPickRoute"));
      if (!proximityPartCountValid) throw new Error(t("proximityInvalidPartCount"));
      const res = await planningRouteEditsRepository.splitRouteByProximity(
        planningWindowId,
        {
          routeId: proximityRouteId,
          partCount: proximityPartCountNum,
          planVehicleIds:
            planVehicleIds.length > 0 ? planVehicleIds : undefined,
        },
      );
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("proximitySplitSuccess"));
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("proximitySplitError")),
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!mergeSourceRouteId || !mergeTargetRouteId)
        throw new Error(t("pickBothRoutes"));
      if (mergeSourceRouteId === mergeTargetRouteId)
        throw new Error(t("mergeRoutesMustDiffer"));
      const body: {
        sourceRouteId: string;
        targetRouteId: string;
        resultVehicleId?: string;
      } = {
        sourceRouteId: mergeSourceRouteId,
        targetRouteId: mergeTargetRouteId,
      };
      if (mergeResultVehicleId) body.resultVehicleId = mergeResultVehicleId;
      const res = await planningRouteEditsRepository.mergeRoutes(planningWindowId, body);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("mergeSuccess"));
      setMergeSourceRouteId("");
      setMergeTargetRouteId("");
      setMergeResultVehicleId("");
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("mergeError")),
  });

  const routeOptions = useMemo(
    () =>
      editableRoutes.map((r) => ({
        value: r.id,
        label: routeLabel(r, t("vehicleFallback")),
      })),
    [editableRoutes, t],
  );

  const moveTargetOptions = useMemo(() => {
    if (!effectiveVisit) return routeOptions;
    return routeOptions.filter((o) => o.value !== effectiveVisit.routeId);
  }, [routeOptions, effectiveVisit]);

  const formBody = (
    <>
      {isConfirmed ? (
        <p className="text-amber-600 text-sm">{t("lockedHint")}</p>
      ) : (
        <>
          <div className="space-y-2 border-b border-border/60 pb-3">
            <h3 className="text-sm font-semibold">{t("moveSectionTitle")}</h3>
            <p className="text-muted-foreground text-xs">{t("moveSectionHelp")}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("visitLabel")}</Label>
              <Select
                value={visitKey || effectiveVisit?.routeStopId || ""}
                onValueChange={(v) => setVisitKey(v ?? "")}
                items={visits.map((v) => ({ value: v.routeStopId, label: v.label }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("visitPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {visits.map((v) => (
                    <SelectItem key={v.routeStopId} value={v.routeStopId}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFromMap && !visitKey ? (
                <p className="text-muted-foreground text-xs">{t("mapSelectionHint")}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("targetRouteLabel")}</Label>
              <Select
                value={targetRouteId}
                onValueChange={(v) => setTargetRouteId(v ?? "")}
                disabled={!effectiveVisit}
                items={moveTargetOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("targetRoutePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {moveTargetOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!effectiveVisit || !targetRouteId || moveMutation.isPending}
              onClick={() => moveMutation.mutate()}
            >
              {moveMutation.isPending ? t("applying") : t("moveStop")}
            </Button>
          </div>

          <div className="space-y-2 border-b border-border/60 py-3">
            <h3 className="text-sm font-semibold">{t("mergeSectionTitle")}</h3>
            <p className="text-muted-foreground text-xs">{t("mergeSectionHelp")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("mergeSource")}</Label>
                <Select
                  value={mergeSourceRouteId}
                  onValueChange={(v) => setMergeSourceRouteId(v ?? "")}
                  items={routeOptions.map((o) => ({ value: o.value, label: o.label }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("mergeSourcePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("mergeTarget")}</Label>
                <Select
                  value={mergeTargetRouteId}
                  onValueChange={(v) => setMergeTargetRouteId(v ?? "")}
                  items={routeOptions.map((o) => ({ value: o.value, label: o.label }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("mergeTargetPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("mergeResultVehicleLabel")}</Label>
              <Select
                value={mergeResultVehicleId}
                onValueChange={(v) => setMergeResultVehicleId(v ?? "")}
                disabled={!mergeTargetRouteId || vehicleChoices.length === 0}
                items={vehicleChoices.map((v) => ({
                  value: v.vehicleId,
                  label: v.displayName,
                }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("mergeResultVehiclePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleChoices.map((v) => (
                    <SelectItem key={v.vehicleId} value={v.vehicleId}>
                      {v.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t("mergeResultVehicleHelp")}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={
                !mergeSourceRouteId ||
                !mergeTargetRouteId ||
                mergeSourceRouteId === mergeTargetRouteId ||
                !mergeResultVehicleId ||
                mergeMutation.isPending
              }
              onClick={() => mergeMutation.mutate()}
            >
              {mergeMutation.isPending ? t("applying") : t("mergeRoutes")}
            </Button>
          </div>

          <div className="space-y-2 border-b border-border/60 py-3">
            <h3 className="text-sm font-semibold">{t("proximitySplitSectionTitle")}</h3>
            <p className="text-muted-foreground text-xs">{t("proximitySplitSectionHelp")}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("proximitySplitRouteLabel")}</Label>
              <Select
                value={proximityRouteId}
                onValueChange={(v) => setProximityRouteId(v ?? "")}
                items={routeOptions.map((o) => ({ value: o.value, label: o.label }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("proximitySplitRoutePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {routeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="proximity-part-count">
                {t("proximityPartCountLabel")}
              </Label>
              <Input
                id="proximity-part-count"
                type="number"
                min={proximityMaxParts >= 2 ? 2 : undefined}
                max={proximityMaxParts > 0 ? proximityMaxParts : undefined}
                className="h-9"
                value={proximityPartCount}
                onChange={(e) => setProximityPartCount(e.target.value)}
                disabled={!proximityRouteId || proximityMaxParts < 2}
              />
              {proximityRoute ? (
                <p className="text-muted-foreground text-xs">
                  {proximityMaxParts >= 2
                    ? t("proximityPartCountHint", {
                        min: 2,
                        max: proximityMaxParts,
                        stops: proximityRoute.stops.length,
                        vehicles: proximityAvailableVehicleIds.length,
                      })
                    : t("proximityNotEnoughVehicles")}
                </p>
              ) : null}
            </div>
            {proximityAvailableVehicleIds.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {t("proximityAvailableVehicles")}{" "}
                {proximityAvailableVehicleIds
                  .map((id) => vehicleLabelForId(id, routes, fleetVehicles))
                  .join(", ")}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={
                !proximityRouteId ||
                !proximityPartCountValid ||
                proximitySplitMutation.isPending
              }
              onClick={() => proximitySplitMutation.mutate()}
            >
              {proximitySplitMutation.isPending
                ? t("applying")
                : t("proximitySplitAction")}
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            <h3 className="text-sm font-semibold">{t("splitSectionTitle")}</h3>
            <p className="text-muted-foreground text-xs">{t("splitSectionHelp")}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("splitVisitLabel")}</Label>
              <Select
                value={splitVisitKey}
                onValueChange={(v) => setSplitVisitKey(v ?? "")}
                disabled={splitVisitOptions.length === 0}
                items={splitVisitOptions.map((v) => ({
                  value: v.routeStopId,
                  label: v.label,
                }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("splitVisitPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {splitVisitOptions.map((v) => (
                    <SelectItem key={v.routeStopId} value={v.routeStopId}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("splitNewRouteVehicleLabel")}</Label>
              <Select
                value={splitNewRouteVehicleId}
                onValueChange={(v) => setSplitNewRouteVehicleId(v ?? "")}
                disabled={!splitVisitKey || vehicleChoices.length === 0}
                items={vehicleChoices.map((v) => ({
                  value: v.vehicleId,
                  label: v.displayName,
                }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("splitNewRouteVehiclePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleChoices.map((v) => (
                    <SelectItem key={v.vehicleId} value={v.vehicleId}>
                      {v.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t("splitNewRouteVehicleHelp")}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !splitVisitKey || !splitNewRouteVehicleId || splitMutation.isPending
              }
              onClick={() => splitMutation.mutate()}
            >
              {splitMutation.isPending ? t("applying") : t("splitRoute")}
            </Button>
          </div>
        </>
      )}
    </>
  );

  if (editableRoutes.length === 0) {
    if (embedded) {
      return <p className="text-muted-foreground px-1 py-2 text-sm">{t("noRoutes")}</p>;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("noRoutes")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (embedded) {
    return (
      <div className={cn("space-y-0 px-1 pb-2")}>
        <p className="text-muted-foreground mb-2 text-xs leading-snug">{t("subtitle")}</p>
        {formBody}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{formBody}</CardContent>
    </Card>
  );
}
