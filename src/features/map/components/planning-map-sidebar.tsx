"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanningRouteEditPanel } from "@/features/map/components/planning-route-edit-panel";
import { PlanningRouteInsightsPanel } from "@/features/map/components/planning-route-insights-panel";
import { PlanningStopOverviewPanel } from "@/features/map/components/planning-stop-overview-panel";
import type {
  DeliveryStopResponseDto,
  MapOverlayModel,
  PolygonRegionAlgorithm,
  RouteResponseDto,
} from "@/features/map/domain/planning-map.types";

export type PlanningMapPlanDriverOption = {
  driverId: string;
  displayName: string;
};

export type PlanningMapSidebarProps = {
  overlay: MapOverlayModel | null | undefined;
  polygonAlgorithm: PolygonRegionAlgorithm;
  mapStops: DeliveryStopResponseDto[] | null | undefined;
  routes: RouteResponseDto[] | null | undefined;
  /** Extra drivers on the fleet plan (e.g. shifts) beyond those already on routes. */
  planDrivers?: PlanningMapPlanDriverOption[] | null;
  /**
   * Driver IDs checked under "Drivers included in this plan" (draft route generation).
   * When non-empty, merge/split driver lists prioritize and label drivers not in this set.
   */
  driversIncludedInRouteGeneration?: string[] | null;
  canShowMap: boolean;
  routeEditActive: boolean;
  isConfirmed: boolean;
  planningWindowId: string;
  selectedDeliveryStopId: string | null;
  onClearMapSelection: () => void;
  repositioningDeliveryStopId: string | null;
  onEditStop: (id: string) => void;
  onStartReposition: (id: string) => void;
  onAfterMutation: () => Promise<void>;
};

type SidebarTab = "insights" | "overview" | "edits";

export function PlanningMapSidebar({
  overlay,
  polygonAlgorithm,
  mapStops,
  routes,
  planDrivers,
  driversIncludedInRouteGeneration,
  canShowMap,
  routeEditActive,
  isConfirmed,
  planningWindowId,
  selectedDeliveryStopId,
  onClearMapSelection,
  repositioningDeliveryStopId,
  onEditStop,
  onStartReposition,
  onAfterMutation,
}: PlanningMapSidebarProps) {
  const t = useTranslations("UiMap");
  const [tab, setTab] = useState<SidebarTab>("overview");

  useEffect(() => {
    if (tab === "edits" && !routeEditActive) setTab("overview");
  }, [tab, routeEditActive]);

  useEffect(() => {
    if (tab === "insights" && !overlay?.routes.length) setTab("overview");
  }, [tab, overlay?.routes.length]);

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-2 xl:max-h-[min(70vh,560px)]">
      <Card className="shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("routesTitle")}</CardTitle>
          <CardDescription>{t("routesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          {overlay?.routes.length ? (
            overlay.routes.map((r) => (
              <div
                key={r.routeId}
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
              >
                <span
                  className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: r.color }}
                />
                <span className="truncate font-medium">{r.driverName}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t("noRoutes")}</p>
          )}
        </CardContent>
      </Card>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-border/80 bg-muted/40 p-1.5 shadow-inner">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            const next = String(v);
            if (next === "insights" || next === "overview" || next === "edits") {
              if (next === "edits" && !routeEditActive) return;
              setTab(next);
            }
          }}
          className="flex min-h-0 flex-1 flex-col gap-2"
        >
          <TabsList
            variant="default"
            className="!h-auto grid w-full shrink-0 grid-cols-3 gap-1 border-0 bg-transparent p-0 shadow-none"
          >
            <TabsTrigger
              value="insights"
              disabled={!overlay?.routes.length}
              className="min-h-10 min-w-0 rounded-lg border border-transparent px-1.5 py-2 text-center text-xs font-semibold tracking-tight transition-colors sm:px-2 sm:text-sm data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"
              title={t("routeInsightsTitle")}
            >
              {t("mapSidebarTabInsights")}
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              disabled={!canShowMap || !mapStops}
              className="min-h-10 min-w-0 rounded-lg border border-transparent px-1.5 py-2 text-center text-xs font-semibold tracking-tight transition-colors sm:px-2 sm:text-sm data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"
              title={t("stopOverviewTitle")}
            >
              {t("mapSidebarTabOverview")}
            </TabsTrigger>
            <TabsTrigger
              value="edits"
              disabled={!routeEditActive || !routes?.length}
              className="min-h-10 min-w-0 rounded-lg border border-transparent px-1.5 py-2 text-center text-xs font-semibold tracking-tight transition-colors sm:px-2 sm:text-sm data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"
              title={t("mapSidebarTabEditsTitle")}
            >
              {t("mapSidebarTabEdits")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="insights"
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0"
          >
            {overlay?.routes.length ? (
              <PlanningRouteInsightsPanel
                overlay={overlay}
                polygonAlgorithm={polygonAlgorithm}
              />
            ) : (
              <p className="text-muted-foreground px-1 py-2 text-sm">
                {t("mapSidebarInsightsEmpty")}
              </p>
            )}
          </TabsContent>

          <TabsContent
            value="overview"
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0"
          >
            {canShowMap && mapStops ? (
              <PlanningStopOverviewPanel
                selectedDeliveryStopId={selectedDeliveryStopId}
                stops={mapStops}
                routes={routes ?? undefined}
                routeEditActive={routeEditActive}
                isConfirmed={isConfirmed}
                repositioningDeliveryStopId={repositioningDeliveryStopId}
                onEditStop={onEditStop}
                onStartReposition={onStartReposition}
              />
            ) : (
              <p className="text-muted-foreground px-1 py-2 text-sm">
                {t("mapSidebarOverviewEmpty")}
              </p>
            )}
          </TabsContent>

          <TabsContent
            value="edits"
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0"
          >
            {routeEditActive && routes?.length ? (
              <PlanningRouteEditPanel
                planningWindowId={planningWindowId}
                isConfirmed={isConfirmed}
                routes={routes}
                planDrivers={planDrivers ?? undefined}
                driversIncludedInRouteGeneration={
                  driversIncludedInRouteGeneration ?? undefined
                }
                selectedDeliveryStopId={selectedDeliveryStopId}
                onClearSelection={onClearMapSelection}
                onAfterMutation={onAfterMutation}
              />
            ) : (
              <p className="text-muted-foreground px-1 py-2 text-sm">
                {t("mapSidebarEditsEmpty")}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
