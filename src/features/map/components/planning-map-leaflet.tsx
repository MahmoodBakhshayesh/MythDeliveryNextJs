"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  WMSTileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useTranslations } from "next-intl";
import type {
  MapOverlayModel,
  RouteLayerModel,
  RouteStopEditMapContext,
  StopPinModel,
} from "@/features/map/domain/planning-map.types";
import { StopRouteEditPopupContent } from "@/features/map/components/stop-route-edit-popup-content";
import {
  getMapTileAttribution,
  getMapTileUrl,
  getMapUseWms,
  getMapWmsFormat,
  getMapWmsLayers,
} from "@/lib/env";

const DEFAULT_CENTER: [number, number] = [47.4, 8.55];
const DEFAULT_ZOOM = 6;

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const signature = useMemo(
    () => points.map((p) => `${p[0]},${p[1]}`).join("|"),
    [points],
  );

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, points, signature]);

  return null;
}

function MapClickLayer({
  onMapClick,
  onBackgroundClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onBackgroundClick?: () => void;
}) {
  useMapEvents({
    click(e) {
      onBackgroundClick?.();
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RouteHull({ layer }: { layer: RouteLayerModel }) {
  if (!layer.hull?.length) return null;
  return (
    <Polygon
      positions={layer.hull}
      pathOptions={{
        color: layer.color,
        fillColor: layer.color,
        fillOpacity: 0.14,
        weight: 1,
      }}
    />
  );
}

function RouteLine({ layer }: { layer: RouteLayerModel }) {
  if (layer.polyline.length < 2) return null;
  return (
    <Polyline
      positions={layer.polyline}
      pathOptions={{ color: layer.color, weight: 4, opacity: 0.9 }}
    />
  );
}

function RepositionPinMarker({
  stop,
  onDragEnd,
}: {
  stop: StopPinModel;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "border-0 bg-transparent",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${stop.color};border:3px solid #0f172a;box-sizing:border-box;cursor:grab;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">⇄</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [stop.color],
  );

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      draggable
      icon={icon}
      zIndexOffset={2000}
      eventHandlers={{
        dragend: (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          onDragEnd(ll.lat, ll.lng);
        },
      }}
    />
  );
}

function StopMarkers({
  stops,
  selectedDeliveryStopId,
  onDeliveryStopSelect,
  routeStopEdit,
}: {
  stops: StopPinModel[];
  selectedDeliveryStopId?: string | null;
  onDeliveryStopSelect?: (deliveryStopId: string | null) => void;
  routeStopEdit?: RouteStopEditMapContext | null;
}) {
  const t = useTranslations("UiRouteEdit");
  return (
    <>
      {stops.map((s) => {
        const selected = selectedDeliveryStopId === s.id;
        const selectable = Boolean(onDeliveryStopSelect && s.routeStopId);
        const baseR = s.sequence != null ? 11 : 7;
        const isRepositioning =
          Boolean(routeStopEdit?.repositioningDeliveryStopId === s.id && s.routeStopId);

        if (isRepositioning && routeStopEdit) {
          return (
            <Fragment key={s.id}>
              <RepositionPinMarker
                stop={s}
                onDragEnd={(lat, lng) => {
                  void routeStopEdit.onRepositionDragEnd(s.id, lat, lng);
                }}
              />
            </Fragment>
          );
        }

        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={selected ? baseR + 5 : baseR}
            pathOptions={{
              color: selected ? "#0f172a" : s.color,
              fillColor: s.color,
              fillOpacity: selected ? 1 : 0.95,
              weight: selected ? 3 : 2,
            }}
            eventHandlers={
              selectable
                ? {
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      onDeliveryStopSelect?.(s.id);
                    },
                  }
                : undefined
            }
          >
            {s.sequence != null ? (
              <Tooltip
                direction="center"
                permanent
                opacity={1}
                className="map-stop-seq-tooltip !m-0 !border-0 !bg-transparent !text-white !shadow-none"
              >
                <span className="text-[11px] font-bold leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                  {s.sequence}
                </span>
              </Tooltip>
            ) : null}
            <Popup>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="font-medium">{s.recipientName}</div>
                  {selectable ? (
                    <p className="text-muted-foreground text-xs">
                      {selected ? t("markerSelectedHint") : t("markerSelectHint")}
                    </p>
                  ) : null}
                </div>
                {routeStopEdit &&
                !routeStopEdit.isConfirmed &&
                s.routeStopId &&
                s.routeId ? (
                  <StopRouteEditPopupContent stop={s} context={routeStopEdit} />
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export type PlanningMapLeafletProps = {
  overlay: MapOverlayModel;
  onMapClick: (lat: number, lng: number) => void;
  selectedDeliveryStopId?: string | null;
  /** When provided, assigned stops (on a route) can be clicked to select for route edits. */
  onDeliveryStopSelect?: (deliveryStopId: string | null) => void;
  /** When the plan is editable, stop popups include move/split and stop maintenance actions. */
  routeStopEdit?: RouteStopEditMapContext | null;
};

export function PlanningMapLeaflet({
  overlay,
  onMapClick,
  selectedDeliveryStopId,
  onDeliveryStopSelect,
  routeStopEdit,
}: PlanningMapLeafletProps) {
  const hasBounds = overlay.boundsPoints.length > 0;
  const tileUrl = getMapTileUrl();
  const tileAttribution = getMapTileAttribution();
  const useWms = getMapUseWms();
  const wmsLayers = getMapWmsLayers();
  const wmsFormat = getMapWmsFormat();

  return (
    <div dir="ltr" className="size-full min-h-[420px]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="z-0 size-full min-h-[420px] rounded-lg ring-1 ring-border"
        scrollWheelZoom
      >
        {useWms ? (
          <WMSTileLayer
            attribution={tileAttribution}
            url={tileUrl}
            layers={wmsLayers}
            format={wmsFormat}
            transparent={false}
          />
        ) : (
          <TileLayer attribution={tileAttribution} url={tileUrl} />
        )}
        {hasBounds ? <FitBounds points={overlay.boundsPoints} /> : null}
        <MapClickLayer
          onBackgroundClick={
            onDeliveryStopSelect ? () => onDeliveryStopSelect(null) : undefined
          }
          onMapClick={onMapClick}
        />
        {overlay.routes.map((layer) => (
          <RouteHull key={`hull-${layer.routeId}`} layer={layer} />
        ))}
        {overlay.routes.map((layer) => (
          <RouteLine key={`line-${layer.routeId}`} layer={layer} />
        ))}
        <StopMarkers
          stops={overlay.stops}
          selectedDeliveryStopId={selectedDeliveryStopId}
          onDeliveryStopSelect={onDeliveryStopSelect}
          routeStopEdit={routeStopEdit}
        />
      </MapContainer>
    </div>
  );
}
