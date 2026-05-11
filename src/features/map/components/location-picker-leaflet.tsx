"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, TileLayer, useMapEvents, WMSTileLayer } from "react-leaflet";
import {
  getMapTileAttribution,
  getMapTileUrl,
  getMapUseWms,
  getMapWmsFormat,
  getMapWmsLayers,
} from "@/lib/env";

const DEFAULT_CENTER: [number, number] = [35.6892, 51.389];
const DEFAULT_ZOOM = 11;

function ClickLayer({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerLeaflet({
  picked,
  onPick,
}: {
  picked: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const tileUrl = getMapTileUrl();
  const tileAttribution = getMapTileAttribution();
  const useWms = getMapUseWms();
  const wmsLayers = getMapWmsLayers();
  const wmsFormat = getMapWmsFormat();

  return (
    <div dir="ltr" className="size-full min-h-[320px]">
      <MapContainer
        center={picked ? [picked.lat, picked.lng] : DEFAULT_CENTER}
        zoom={picked ? 14 : DEFAULT_ZOOM}
        className="z-0 size-full min-h-[320px] rounded-lg ring-1 ring-border"
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
        <ClickLayer onPick={onPick} />
        {picked ? (
          <CircleMarker
            center={[picked.lat, picked.lng]}
            radius={8}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#2563eb",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
