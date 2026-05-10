"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Car, UserRound } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DriverHomePage() {
  const t = useTranslations("UiDriverPortal");

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

      <div className="grid gap-4 sm:grid-cols-2">
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
