/** Matches MythDeliveryWebApi AppResponsePayload JSON (camelCase via Newtonsoft). */
export type AppResponse<T> = {
  status: number;
  message: string;
  problem?: unknown;
  body?: T;
};

export function isAppSuccess<T>(r: AppResponse<T>): boolean {
  return r.status > 0 && r.status < 400;
}

export function appErrorMessage(r: AppResponse<unknown>): string {
  if (typeof r.problem === "object" && r.problem && "detail" in r.problem) {
    const d = (r.problem as { detail?: string }).detail;
    if (d) return d;
  }
  return r.message || "Request failed";
}
