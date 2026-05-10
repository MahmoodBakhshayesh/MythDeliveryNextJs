"use client";

import { useTranslations } from "next-intl";
import {
  Building2,
  Package,
  Radio,
  Truck,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

  const tiles = [
    {
      titleKey: "orgsTitle" as const,
      descKey: "orgsDesc" as const,
      href: "/organizations",
      icon: Building2,
    },
    {
      titleKey: "fleetTitle" as const,
      descKey: "fleetDesc" as const,
      href: "/fleet",
      icon: Truck,
    },
    {
      titleKey: "packagesTitle" as const,
      descKey: "packagesDesc" as const,
      href: "/packages",
      icon: Package,
    },
    {
      titleKey: "liveTitle" as const,
      descKey: "liveDesc" as const,
      href: "/live",
      icon: Radio,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map(({ titleKey, descKey, href, icon: Icon }) => (
          <Card key={href} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-5 opacity-80" />
                  {t(titleKey)}
                </CardTitle>
                <CardDescription>{t(descKey)}</CardDescription>
              </div>
              <Link
                href={href}
                aria-label={t(titleKey)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                )}
              >
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
