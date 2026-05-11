"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  RouteStopEditMapContext,
  RouteResponseDto,
  StopPinModel,
} from "@/features/map/domain/planning-map.types";
import { planningRouteEditsRepository } from "@/features/map/repositories/planning-route-edits.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

function structuralRoutes(routes: RouteResponseDto[]) {
  return routes.filter((r) => r.status !== 4);
}

export type StopRouteEditPopupContentProps = {
  stop: StopPinModel;
  context: RouteStopEditMapContext;
};

export function StopRouteEditPopupContent({
  stop,
  context,
}: StopRouteEditPopupContentProps) {
  const t = useTranslations("UiRouteEdit");
  const list = useMemo(() => structuralRoutes(context.routes), [context.routes]);
  const [targetRouteId, setTargetRouteId] = useState("");

  const route = useMemo(
    () => list.find((r) => r.id === stop.routeId),
    [list, stop.routeId],
  );
  const stopCount = route?.stops.length ?? 0;
  const canSplit =
    Boolean(stop.routeStopId) &&
    (stop.sequence ?? 0) > 1 &&
    (stop.sequence ?? 0) < stopCount;

  const isRepositioning = context.repositioningDeliveryStopId === stop.id;

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (!stop.routeStopId) throw new Error(t("pickVisit"));
      if (!targetRouteId || targetRouteId === stop.routeId) {
        throw new Error(t("pickDifferentTargetRoute"));
      }
      const res = await planningRouteEditsRepository.moveStop(
        context.planningWindowId,
        {
          routeStopId: stop.routeStopId,
          targetRouteId,
        },
      );
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("moveSuccess"));
      setTargetRouteId("");
      context.onRepositioningDeliveryStopChange(null);
      await context.onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("moveError")),
  });

  const splitMutation = useMutation({
    mutationFn: async () => {
      if (!stop.routeStopId) throw new Error(t("pickVisit"));
      const res = await planningRouteEditsRepository.splitRoute(
        context.planningWindowId,
        {
          splitBeforeRouteStopId: stop.routeStopId,
        },
      );
      if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
    },
    onSuccess: async () => {
      toast.success(t("splitSuccess"));
      await context.onAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message || t("splitError")),
  });

  if (!stop.routeStopId || !stop.routeId) return null;

  const targetOptions = list.filter((r) => r.id !== stop.routeId);

  return (
    <div className="min-w-[220px] space-y-3 py-1">
      <p className="text-muted-foreground text-xs font-medium">
        {t("stopPopupEditTitle")}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => context.onEditDeliveryStop(stop.id)}
        >
          {t("stopPopupEditDetails")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isRepositioning ? "secondary" : "outline"}
          className="flex-1"
          onClick={() =>
            context.onRepositioningDeliveryStopChange(
              isRepositioning ? null : stop.id,
            )
          }
        >
          {isRepositioning
            ? t("stopPopupCancelDrag")
            : t("stopPopupDragOnMap")}
        </Button>
      </div>
      {isRepositioning ? (
        <p className="text-muted-foreground text-[11px] leading-snug">
          {t("stopPopupDragHint")}
        </p>
      ) : null}

      <div className="space-y-1.5 border-t pt-2">
        <Label className="text-xs">{t("stopPopupMoveLabel")}</Label>
        <select
          className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          value={targetRouteId}
          onChange={(e) => setTargetRouteId(e.target.value)}
        >
          <option value="">{t("targetRoutePlaceholder")}</option>
          {targetOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.driverName?.trim() || `Route ${r.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={
            !targetRouteId ||
            targetRouteId === stop.routeId ||
            moveMutation.isPending
          }
          onClick={() => moveMutation.mutate()}
        >
          {moveMutation.isPending ? t("applying") : t("moveStop")}
        </Button>
      </div>

      <div className="space-y-1.5 border-t pt-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={!canSplit || splitMutation.isPending}
          onClick={() => splitMutation.mutate()}
        >
          {splitMutation.isPending ? t("applying") : t("stopPopupSplit")}
        </Button>
        {!canSplit && stopCount > 1 ? (
          <p className="text-muted-foreground text-[11px] leading-snug">
            {(stop.sequence ?? 0) <= 1
              ? t("splitDisabledFirst")
              : t("splitDisabledLast")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 border-t pt-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full"
          disabled={context.stopEditBusy}
          onClick={() => {
            if (!stop.routeStopId) return;
            if (!window.confirm(t("removeFromRouteConfirm"))) return;
            void (async () => {
              try {
                await context.removeVisit(stop.routeStopId!);
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : t("removeFromRouteErrorToast"),
                );
              }
            })();
          }}
        >
          {context.stopEditBusy ? t("applying") : t("removeFromRoute")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="w-full"
          disabled={context.stopEditBusy}
          onClick={() => {
            if (!window.confirm(t("deleteStopConfirm"))) return;
            void (async () => {
              try {
                await context.deleteStop(stop.id);
                context.onRepositioningDeliveryStopChange(null);
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : t("deleteStopErrorToast"),
                );
              }
            })();
          }}
        >
          {context.stopEditBusy ? t("applying") : t("deleteStop")}
        </Button>
      </div>
    </div>
  );
}
