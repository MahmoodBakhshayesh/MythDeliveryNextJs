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
