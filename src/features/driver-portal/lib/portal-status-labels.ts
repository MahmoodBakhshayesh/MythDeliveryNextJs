/**
 * Shared labels for driver portal — same keys as {@link UiDriverPortal} in messages.
 */
export function formatDriverPortalPackageStatus(
  status: number | string,
  translate: (key: string, values?: { code: number }) => string,
): string {
  const n = typeof status === "string" ? Number.parseInt(status, 10) : status;
  if (Number.isNaN(n)) return String(status);
  const keys = [
    "pkgStatus0",
    "pkgStatus1",
    "pkgStatus2",
    "pkgStatus3",
    "pkgStatus4",
    "pkgStatus5",
    "pkgStatus6",
    "pkgStatus7",
    "pkgStatus8",
    "pkgStatus9",
    "pkgStatus10",
    "pkgStatus11",
    "pkgStatus12",
  ] as const;
  if (n >= 0 && n < keys.length) return translate(keys[n]);
  return translate("pkgStatusFallback", { code: n });
}

export function formatDriverPortalRouteStatus(
  status: number,
  translate: (key: string, values?: { code: number }) => string,
): string {
  switch (status) {
    case 0:
      return translate("historyRouteDraft");
    case 1:
      return translate("historyRoutePlanned");
    case 2:
      return translate("historyRouteActive");
    case 3:
      return translate("historyRouteCompleted");
    case 4:
      return translate("historyRouteCancelled");
    default:
      return translate("historyRouteUnknown", { code: status });
  }
}
