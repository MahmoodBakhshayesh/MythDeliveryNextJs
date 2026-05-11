"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { planningRouteEditsRepository } from "@/features/map/repositories/planning-route-edits.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

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

function buildVisitOptions(routes: RouteResponseDto[]): VisitOption[] {
  const rows: VisitOption[] = [];
  for (const r of routes) {
    const driver = r.driverName?.trim() || "Driver";
    const sorted = [...r.stops].sort((a, b) => a.sequence - b.sequence);
    const stopsOnRoute = sorted.length;
    for (const rs of sorted) {
      const name = rs.recipientName?.trim() || "Stop";
      rows.push({
        routeStopId: rs.id,
        deliveryStopId: rs.deliveryStopId,
        routeId: r.id,
        label: `${driver} · #${rs.sequence} · ${name}`,
        sequence: rs.sequence,
        stopsOnRoute,
      });
    }
  }
  return rows;
}

export type PlanningRoutePlanDriverOption = {
  driverId: string;
  displayName: string;
};

export type PlanningRouteEditPanelProps = {
  planningWindowId: string;
  isConfirmed: boolean;
  routes: RouteResponseDto[];
  /** Drivers on the fleet plan (routes + optional shift-only drivers). */
  planDrivers?: PlanningRoutePlanDriverOption[] | null;
  /**
   * IDs from "Drivers included in this plan" (route generation checkboxes).
   * When this list is non-empty, drivers **not** checked appear first in merge/split picks and get a short label.
   */
  driversIncludedInRouteGeneration?: string[] | null;
  selectedDeliveryStopId: string | null;
  onClearSelection: () => void;
  onAfterMutation: () => Promise<void>;
};

export function PlanningRouteEditPanel({
  planningWindowId,
  isConfirmed,
  routes,
  planDrivers,
  driversIncludedInRouteGeneration,
  selectedDeliveryStopId,
  onClearSelection,
  onAfterMutation,
}: PlanningRouteEditPanelProps) {
  const t = useTranslations("UiRouteEdit");
  const [visitKey, setVisitKey] = useState("");
  const [targetRouteId, setTargetRouteId] = useState("");
  const [mergeSourceRouteId, setMergeSourceRouteId] = useState("");
  const [mergeTargetRouteId, setMergeTargetRouteId] = useState("");
  const [mergeResultDriverId, setMergeResultDriverId] = useState("");
  const [splitVisitKey, setSplitVisitKey] = useState("");
  const [splitNewRouteDriverId, setSplitNewRouteDriverId] = useState("");

  const editableRoutes = useMemo(() => structuralRoutes(routes), [routes]);
  const driverChoices = useMemo(() => {
    const pool = driversIncludedInRouteGeneration;
    const useCheckboxPool = Array.isArray(pool) && pool.length > 0;

    type Row = { driverId: string; baseName: string; outsideGenPool: boolean };
    const rows: Row[] = [];
    const seen = new Set<string>();

    for (const d of planDrivers ?? []) {
      if (seen.has(d.driverId)) continue;
      seen.add(d.driverId);
      const outsideGenPool = useCheckboxPool && !pool.includes(d.driverId);
      rows.push({
        driverId: d.driverId,
        baseName: d.displayName,
        outsideGenPool,
      });
    }
    for (const r of editableRoutes) {
      if (seen.has(r.driverId)) continue;
      seen.add(r.driverId);
      const outsideGenPool = useCheckboxPool && !pool.includes(r.driverId);
      rows.push({
        driverId: r.driverId,
        baseName: r.driverName?.trim() || t("driverFallback"),
        outsideGenPool,
      });
    }

    rows.sort((a, b) => {
      if (a.outsideGenPool !== b.outsideGenPool) return a.outsideGenPool ? -1 : 1;
      return a.baseName.localeCompare(b.baseName);
    });

    return rows.map((row) => ({
      driverId: row.driverId,
      displayName: row.outsideGenPool
        ? `${row.baseName} (${t("notInRouteGenPool")})`
        : row.baseName,
    }));
  }, [
    editableRoutes,
    planDrivers,
    driversIncludedInRouteGeneration,
    t,
  ]);
  const visits = useMemo(() => buildVisitOptions(editableRoutes), [editableRoutes]);
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
    if (tr) setMergeResultDriverId(tr.driverId);
  }, [mergeTargetRouteId, editableRoutes]);

  useEffect(() => {
    if (splitVisitKey && !splitVisitOptions.some((v) => v.routeStopId === splitVisitKey))
      setSplitVisitKey("");
  }, [splitVisitOptions, splitVisitKey]);

  useEffect(() => {
    if (!splitVisitKey) return;
    const v = splitVisitOptions.find((x) => x.routeStopId === splitVisitKey);
    const route = v ? editableRoutes.find((r) => r.id === v.routeId) : null;
    if (route) setSplitNewRouteDriverId(route.driverId);
  }, [splitVisitKey, splitVisitOptions, editableRoutes]);

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
      const body: { splitBeforeRouteStopId: string; newRouteDriverId?: string } = {
        splitBeforeRouteStopId: splitVisitKey,
      };
      if (splitNewRouteDriverId) body.newRouteDriverId = splitNewRouteDriverId;
      const res = await planningRouteEditsRepository.splitRoute(planningWindowId, body);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("splitSuccess"));
      setSplitVisitKey("");
      setSplitNewRouteDriverId("");
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("splitError")),
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
        resultDriverId?: string;
      } = {
        sourceRouteId: mergeSourceRouteId,
        targetRouteId: mergeTargetRouteId,
      };
      if (mergeResultDriverId) body.resultDriverId = mergeResultDriverId;
      const res = await planningRouteEditsRepository.mergeRoutes(planningWindowId, body);
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("mergeSuccess"));
      setMergeSourceRouteId("");
      setMergeTargetRouteId("");
      setMergeResultDriverId("");
      onClearSelection();
      await onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("mergeError")),
  });

  const routeOptions = useMemo(
    () =>
      editableRoutes.map((r) => ({
        value: r.id,
        label: r.driverName?.trim() || `Route ${r.id.slice(0, 8)}`,
      })),
    [editableRoutes],
  );

  const moveTargetOptions = useMemo(() => {
    if (!effectiveVisit) return routeOptions;
    return routeOptions.filter((o) => o.value !== effectiveVisit.routeId);
  }, [routeOptions, effectiveVisit]);

  if (editableRoutes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("noRoutes")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConfirmed ? (
          <p className="text-amber-600 text-sm">{t("lockedHint")}</p>
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t("moveSectionTitle")}</h3>
              <p className="text-muted-foreground text-xs">{t("moveSectionHelp")}</p>
              <div className="space-y-2">
                <Label>{t("visitLabel")}</Label>
                <Select
                  value={visitKey || effectiveVisit?.routeStopId || ""}
                  onValueChange={(v) => setVisitKey(v ?? "")}
                  items={visits.map((v) => ({ value: v.routeStopId, label: v.label }))}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>{t("targetRouteLabel")}</Label>
                <Select
                  value={targetRouteId}
                  onValueChange={(v) => setTargetRouteId(v ?? "")}
                  disabled={!effectiveVisit}
                  items={moveTargetOptions.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                >
                  <SelectTrigger>
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

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">{t("mergeSectionTitle")}</h3>
              <p className="text-muted-foreground text-xs">{t("mergeSectionHelp")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("mergeSource")}</Label>
                  <Select
                    value={mergeSourceRouteId}
                    onValueChange={(v) => setMergeSourceRouteId(v ?? "")}
                    items={routeOptions.map((o) => ({ value: o.value, label: o.label }))}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>{t("mergeTarget")}</Label>
                  <Select
                    value={mergeTargetRouteId}
                    onValueChange={(v) => setMergeTargetRouteId(v ?? "")}
                    items={routeOptions.map((o) => ({ value: o.value, label: o.label }))}
                  >
                    <SelectTrigger>
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
              <div className="space-y-2">
                <Label>{t("mergeResultDriverLabel")}</Label>
                <Select
                  value={mergeResultDriverId}
                  onValueChange={(v) => setMergeResultDriverId(v ?? "")}
                  disabled={!mergeTargetRouteId || driverChoices.length === 0}
                  items={driverChoices.map((d) => ({
                    value: d.driverId,
                    label: d.displayName,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("mergeResultDriverPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {driverChoices.map((d) => (
                      <SelectItem key={d.driverId} value={d.driverId}>
                        {d.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{t("mergeResultDriverHelp")}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={
                  !mergeSourceRouteId ||
                  !mergeTargetRouteId ||
                  mergeSourceRouteId === mergeTargetRouteId ||
                  !mergeResultDriverId ||
                  mergeMutation.isPending
                }
                onClick={() => mergeMutation.mutate()}
              >
                {mergeMutation.isPending ? t("applying") : t("mergeRoutes")}
              </Button>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">{t("splitSectionTitle")}</h3>
              <p className="text-muted-foreground text-xs">{t("splitSectionHelp")}</p>
              <div className="space-y-2">
                <Label>{t("splitVisitLabel")}</Label>
                <Select
                  value={splitVisitKey}
                  onValueChange={(v) => setSplitVisitKey(v ?? "")}
                  disabled={splitVisitOptions.length === 0}
                  items={splitVisitOptions.map((v) => ({
                    value: v.routeStopId,
                    label: v.label,
                  }))}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>{t("splitNewRouteDriverLabel")}</Label>
                <Select
                  value={splitNewRouteDriverId}
                  onValueChange={(v) => setSplitNewRouteDriverId(v ?? "")}
                  disabled={!splitVisitKey || driverChoices.length === 0}
                  items={driverChoices.map((d) => ({
                    value: d.driverId,
                    label: d.displayName,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("splitNewRouteDriverPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {driverChoices.map((d) => (
                      <SelectItem key={d.driverId} value={d.driverId}>
                        {d.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{t("splitNewRouteDriverHelp")}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  !splitVisitKey || !splitNewRouteDriverId || splitMutation.isPending
                }
                onClick={() => splitMutation.mutate()}
              >
                {splitMutation.isPending ? t("applying") : t("splitRoute")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
