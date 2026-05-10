"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Database, LayoutDashboard } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHubPage() {
  const t = useTranslations("UiAdmin");
  const tn = useTranslations("Nav");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("hubTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("hubSubtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/operations">
          <Card className="border-destructive/40 transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="size-5" />
                {t("navMaintenance")}
              </CardTitle>
              <CardDescription>{t("operationsIntro")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LayoutDashboard className="size-5" />
                {tn("dashboard")}
              </CardTitle>
              <CardDescription>{t("hubBackDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
