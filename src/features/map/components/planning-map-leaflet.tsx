"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import type {
  MapOverlayModel,
  RouteLayerModel,
  StopPinModel,
} from "@/features/map/domain/planning-map.types";

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
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
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

function StopMarkers({ stops }: { stops: StopPinModel[] }) {
  return stops.map((s) => (
    <CircleMarker
      key={s.id}
      center={[s.lat, s.lng]}
      radius={7}
      pathOptions={{
        color: s.color,
        fillColor: s.color,
        fillOpacity: 0.95,
        weight: 2,
      }}
    >
      <Popup>{s.recipientName}</Popup>
    </CircleMarker>
  ));
}

export type PlanningMapLeafletProps = {
  overlay: MapOverlayModel;
  onMapClick: (lat: number, lng: number) => void;
};

export function PlanningMapLeaflet({
  overlay,
  onMapClick,
}: PlanningMapLeafletProps) {
  const hasBounds = overlay.boundsPoints.length > 0;

  return (
    <div dir="ltr" className="size-full min-h-[420px]">
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="z-0 size-full min-h-[420px] rounded-lg ring-1 ring-border"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasBounds ? <FitBounds points={overlay.boundsPoints} /> : null}
      <MapClickLayer onMapClick={onMapClick} />
      {overlay.routes.map((layer) => (
        <RouteHull key={`hull-${layer.routeId}`} layer={layer} />
      ))}
      {overlay.routes.map((layer) => (
        <RouteLine key={`line-${layer.routeId}`} layer={layer} />
      ))}
      <StopMarkers stops={overlay.stops} />
    </MapContainer>
    </div>
  );
}
