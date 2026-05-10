/** Browser-safe public env (must be prefixed NEXT_PUBLIC_). */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!url) {
    console.warn("NEXT_PUBLIC_API_URL is unset; using http://localhost:5128");
    return "http://localhost:5128";
  }
  return url;
}

/** Origin for SignalR (same host/port as API). */
export function getWsBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  return url ?? getApiBaseUrl();
}

/**
 * Map tile layer config (Leaflet).
 * Set these for Map.ir (or any provider) without code changes.
 */
export function getMapTileUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const key = process.env.NEXT_PUBLIC_MAP_API_KEY ?? "";
  return raw.replaceAll("{mapApiKey}", encodeURIComponent(key));
}

export function getMapTileAttribution(): string {
  const raw =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const key = process.env.NEXT_PUBLIC_MAP_API_KEY ?? "";
  return raw.replaceAll("{mapApiKey}", encodeURIComponent(key));
}

export function getMapUseWms(): boolean {
  return String(process.env.NEXT_PUBLIC_MAP_USE_WMS ?? "").toLowerCase() === "true";
}

export function getMapWmsLayers(): string {
  return process.env.NEXT_PUBLIC_MAP_WMS_LAYERS ?? "Shiveh:ShivehGSLD256";
}

export function getMapWmsFormat(): string {
  return process.env.NEXT_PUBLIC_MAP_WMS_FORMAT ?? "image/png";
}
