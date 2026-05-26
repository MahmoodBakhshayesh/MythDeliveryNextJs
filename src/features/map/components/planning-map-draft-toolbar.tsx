"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POLYGON_REGION_OPTIONS,
  type PolygonRegionAlgorithm,
} from "@/features/map/domain/planning-map.types";

export type PlanningMapDraftToolbarProps = {
  planningStrategy: string;
  planningStrategies: readonly string[];
  onPlanningStrategyChange: (value: string) => void;
  polygonAlgorithm: PolygonRegionAlgorithm;
  onPolygonAlgorithmChange: (value: PolygonRegionAlgorithm) => void;
  onGenerateDraftRoutes: () => void;
  generateDisabled: boolean;
  generatePending: boolean;
  lockedHint?: string | null;
};

export function PlanningMapDraftToolbar({
  planningStrategy,
  planningStrategies,
  onPlanningStrategyChange,
  polygonAlgorithm,
  onPolygonAlgorithmChange,
  onGenerateDraftRoutes,
  generateDisabled,
  generatePending,
  lockedHint,
}: PlanningMapDraftToolbarProps) {
  const td = useTranslations("UiDeliveries");
  const tm = useTranslations("UiMap");

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <div className="min-w-[min(100%,10rem)] flex-1 space-y-1 sm:max-w-[14rem]">
          <Label className="text-xs">{td("planningStrategy")}</Label>
          <Select
            value={planningStrategy}
            onValueChange={(v) => onPlanningStrategyChange(v ?? planningStrategy)}
            items={planningStrategies.map((s) => ({
              value: s,
              label: td(`planningStrategies.${s}`),
            }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planningStrategies.map((s) => (
                <SelectItem key={s} value={s}>
                  {td(`planningStrategies.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[min(100%,10rem)] flex-1 space-y-1 sm:max-w-[14rem]">
          <Label className="text-xs">{tm("regionAlgorithm")}</Label>
          <Select
            value={polygonAlgorithm}
            onValueChange={(v) =>
              onPolygonAlgorithmChange((v as PolygonRegionAlgorithm) ?? polygonAlgorithm)
            }
            items={POLYGON_REGION_OPTIONS.map((opt) => ({
              value: opt.value,
              label: tm(`polygon.${opt.value}.label`),
            }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POLYGON_REGION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {tm(`polygon.${opt.value}.label`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0"
          onClick={onGenerateDraftRoutes}
          disabled={generateDisabled}
        >
          {generatePending ? td("generatingRoutes") : td("generateDraftRoutes")}
        </Button>
      </div>
      {lockedHint ? (
        <p className="text-amber-600 text-xs leading-snug">{lockedHint}</p>
      ) : null}
    </div>
  );
}
