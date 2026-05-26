"use client";



import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

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

import { cn } from "@/lib/utils";



export type PlanningMapPlanDriverOption = {

  driverId: string;

  displayName: string;

};



export type PlanningMapSidebarProps = {

  overlay: MapOverlayModel | null | undefined;

  polygonAlgorithm: PolygonRegionAlgorithm;

  mapStops: DeliveryStopResponseDto[] | null | undefined;

  routes: RouteResponseDto[] | null | undefined;

  /** @deprecated Driver lists for merge/split are no longer used. */

  planDrivers?: PlanningMapPlanDriverOption[] | null;

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

  highlightedRouteId?: string | null;

  onHighlightRoute?: (routeId: string | null) => void;

  /** When true, sidebar fills parent height (preview wizard layout). */

  fillHeight?: boolean;

  /** Active org fleet vehicles (full catalog, not only wizard step-2 checkboxes). */

  fleetVehicleIds?: string[];

  fleetVehicles?: { id: string; name?: string | null }[];

  planVehicleIds?: string[];

};



type SidebarTab = "insights" | "overview" | "edits";



export function PlanningMapSidebar({

  overlay,

  polygonAlgorithm,

  mapStops,

  routes,

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

  highlightedRouteId,

  onHighlightRoute,

  fillHeight = false,

  fleetVehicleIds,

  fleetVehicles,

  planVehicleIds,

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

    <div

      className={cn(

        "flex min-h-0 w-full min-w-0 max-w-full flex-col gap-1.5",

        fillHeight ? "h-full" : "xl:max-h-[min(70vh,560px)]",

      )}

    >

      {overlay?.routes.length ? (

        <div className="shrink-0 rounded-lg border border-border/80 bg-card/80 px-2 py-1.5">

          <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">

            {t("routesTitle")}

          </p>

          <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">

            {overlay.routes.map((r) => {

              const selected = highlightedRouteId === r.routeId;

              return (

                <button

                  key={r.routeId}

                  type="button"

                  onClick={() =>

                    onHighlightRoute?.(selected ? null : r.routeId)

                  }

                  className={cn(

                    "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/80",

                    selected && "border-primary ring-1 ring-primary/30",

                  )}

                >

                  <span

                    className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"

                    style={{ backgroundColor: r.color }}

                  />

                  <span className="truncate font-medium">{r.driverName}</span>

                </button>

              );

            })}

          </div>

        </div>

      ) : null}



      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden rounded-lg border border-border/80 bg-muted/40 p-1 shadow-inner">

        <Tabs

          value={tab}

          onValueChange={(v) => {

            const next = String(v);

            if (next === "insights" || next === "overview" || next === "edits") {

              if (next === "edits" && !routeEditActive) return;

              setTab(next);

            }

          }}

          className="flex min-h-0 flex-1 flex-col gap-1"

        >

          <TabsList

            variant="default"

            className="!h-auto grid w-full shrink-0 grid-cols-3 gap-0.5 border-0 bg-transparent p-0 shadow-none"

          >

            <TabsTrigger

              value="insights"

              disabled={!overlay?.routes.length}

              className="min-h-9 min-w-0 rounded-md border border-transparent px-1 py-1.5 text-center text-xs font-semibold tracking-tight transition-colors data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"

              title={t("routeInsightsTitle")}

            >

              {t("mapSidebarTabInsights")}

            </TabsTrigger>

            <TabsTrigger

              value="overview"

              disabled={!canShowMap || !mapStops}

              className="min-h-9 min-w-0 rounded-md border border-transparent px-1 py-1.5 text-center text-xs font-semibold tracking-tight transition-colors data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"

              title={t("stopOverviewTitle")}

            >

              {t("mapSidebarTabOverview")}

            </TabsTrigger>

            <TabsTrigger

              value="edits"

              disabled={!routeEditActive || !routes?.length}

              className="min-h-9 min-w-0 rounded-md border border-transparent px-1 py-1.5 text-center text-xs font-semibold tracking-tight transition-colors data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm"

              title={t("mapSidebarTabEditsTitle")}

            >

              {t("mapSidebarTabEdits")}

            </TabsTrigger>

          </TabsList>



          <TabsContent

            value="insights"

            className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0 data-[state=inactive]:hidden"

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

            className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0 data-[state=inactive]:hidden"

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

            className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 focus-visible:ring-0 data-[state=inactive]:hidden"

          >

            {routeEditActive && routes?.length ? (

              <PlanningRouteEditPanel

                embedded

                planningWindowId={planningWindowId}

                isConfirmed={isConfirmed}

                routes={routes}

                highlightedRouteId={highlightedRouteId}

                fleetVehicleIds={fleetVehicleIds}

                fleetVehicles={fleetVehicles}

                planVehicleIds={planVehicleIds}

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

