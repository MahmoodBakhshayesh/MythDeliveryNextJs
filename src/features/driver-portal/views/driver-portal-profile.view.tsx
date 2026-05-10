"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverPortalProfileViewModel } from "@/features/driver-portal/controllers/driver-portal-profile.controller";

export function DriverPortalProfileView({
  viewState,
  actions,
}: DriverPortalProfileViewModel) {
  const t = useTranslations("UiDriverPortal");
  const tc = useTranslations("Common");
  const {
    profile,
    fleetAssignments,
    loading,
    error,
    displayName,
    phone,
    licenseNumber,
    preferPersonal,
    savePending,
    preferencePending,
  } = viewState;

  if (loading && !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full max-w-lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : t("profileLoadError")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("profileTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("profileSubtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("accountSection")}</CardTitle>
          <CardDescription>{t("accountHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>{tc("email")}</Label>
            <Input value={profile.email ?? "—"} disabled readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dp-name">{t("displayName")}</Label>
            <Input
              id="dp-name"
              value={displayName}
              onChange={(e) => actions.setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dp-phone">{tc("phone")}</Label>
            <Input
              id="dp-phone"
              value={phone}
              onChange={(e) => actions.setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dp-lic">{t("license")}</Label>
            <Input
              id="dp-lic"
              value={licenseNumber}
              onChange={(e) => actions.setLicenseNumber(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={savePending}
            onClick={() => actions.saveProfile()}
          >
            {savePending ? tc("saving") : tc("save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("planningVehicleSection")}</CardTitle>
          <CardDescription>{t("planningVehicleHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="border-input mt-1 size-4 rounded border"
              checked={preferPersonal}
              disabled={preferencePending}
              onChange={(e) => actions.setPreferPersonal(e.target.checked)}
            />
            <span className="text-sm leading-snug">{t("preferPersonalCheckbox")}</span>
          </label>
          <p className="text-muted-foreground text-xs">{t("planningVehicleFootnote")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("fleetAssignmentsSection")}</CardTitle>
          <CardDescription>{t("fleetAssignmentsHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          {fleetAssignments?.length ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-start">
                    <th className="px-3 py-2 font-medium">{t("fleetVehicle")}</th>
                    <th className="px-3 py-2 font-medium">{t("fleetPlate")}</th>
                    <th className="px-3 py-2 font-medium">{t("fleetWindow")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetAssignments.map((row) => (
                    <tr key={row.assignmentId} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.vehicle.name}</td>
                      <td className="text-muted-foreground px-3 py-2">
                        {row.vehicle.plateNumber ?? "—"}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {new Date(row.effectiveFrom).toLocaleString()}
                        {" → "}
                        {row.effectiveTo
                          ? new Date(row.effectiveTo).toLocaleString()
                          : t("openEnded")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("noFleetAssignments")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
