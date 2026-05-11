"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Car, Files, History, Package, Route, UserRound } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCanFleetOperations } from "@/lib/use-can-fleet-operations";

export default function DriverHomePage() {
  const t = useTranslations("UiDriverPortal");
  const fleet = useCanFleetOperations();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("homeTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("homeSubtitle")}
        </p>
      </header>

      {fleet ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium text-amber-950 dark:text-amber-100">
            {t("homeFleetBannerTitle")}
          </p>
          <p className="text-muted-foreground mt-1">
            {t("homeFleetBannerDesc")}
          </p>
          <Link
            href="/fleet-plans"
            className="text-primary mt-3 inline-flex items-center gap-1 font-medium underline underline-offset-4"
          >
            <Files className="size-4" />
            {t("homeFleetBannerLink")}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/driver/history">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="size-5" />
                {t("homeCardHistoryTitle")}
              </CardTitle>
              <CardDescription>{t("homeCardHistoryDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/driver/routes">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Route className="size-5" />
                {t("homeCardRoutesTitle")}
              </CardTitle>
              <CardDescription>{t("homeCardRoutesDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/driver/packages">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="size-5" />
                {t("homeCardPackagesTitle")}
              </CardTitle>
              <CardDescription>{t("homeCardPackagesDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/driver/profile">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="size-5" />
                {t("profileTitle")}
              </CardTitle>
              <CardDescription>{t("homeCardProfileDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/driver/vehicles">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="size-5" />
                {t("vehiclesTitle")}
              </CardTitle>
              <CardDescription>{t("homeCardVehiclesDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
