"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverPortalPackagesViewModel } from "@/features/driver-portal/controllers/driver-portal-packages.controller";
import { formatDriverPortalPackageStatus } from "@/features/driver-portal/lib/portal-status-labels";
import { cn } from "@/lib/utils";

export function DriverPortalPackagesView({
  viewState,
}: DriverPortalPackagesViewModel) {
  const t = useTranslations("UiDriverPortal");

  const packageStatusLabel = (status: number | string) =>
    formatDriverPortalPackageStatus(status, t);

  const formatHandledAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("packagesPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("packagesPageSubtitle")}
        </p>
      </header>

      {viewState.loading ? (
        <Skeleton className="h-64 w-full" />
      ) : viewState.error ? (
        <p className="text-destructive text-sm">
          {viewState.error instanceof Error
            ? viewState.error.message
            : t("packagesLoadError")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-start">
                <th className={cn("px-3 py-2 font-medium")}>
                  {t("historyBarcode")}
                </th>
                <th className={cn("px-3 py-2 font-medium")}>
                  {t("historyPkgStatus")}
                </th>
                <th className={cn("px-3 py-2 font-medium")}>
                  {t("historyHandledAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(viewState.packages ?? []).map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{p.barcode}</td>
                  <td className="px-3 py-2">{packageStatusLabel(p.status)}</td>
                  <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                    {formatHandledAt(p.statusChangedAtUtc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!viewState.loading && !viewState.error && viewState.packages?.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("packagesEmpty")}</p>
      ) : null}
    </div>
  );
}
