"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PackagesPageViewModel } from "@/features/packages/controllers/packages-page.controller";

export function PackagesPageView({ viewState, actions }: PackagesPageViewModel) {
  const t = useTranslations("UiPackages");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    packages,
    orgsLoading,
    packagesLoading,
  } = viewState;

  const loading = orgsLoading || packagesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("subtitleFromApi")}{" "}
          <code className="rounded bg-muted px-1">
            GET /api/deliverypackages?organizationId=
          </code>
        </p>
      </div>

      <div className="max-w-md space-y-2">
        <Label>{tc("organization")}</Label>
        <Select
          value={selectedOrgId}
          onValueChange={(v) => actions.setOrgId(v)}
          disabled={orgsLoading || !organizations?.length}
          items={(organizations ?? []).map((o) => ({
            value: o.id,
            label: o.name,
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={tc("selectOrganization")} />
          </SelectTrigger>
          <SelectContent>
            {organizations?.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ScrollArea className="h-[min(480px,70vh)] rounded-lg border">
          <div className="divide-y p-2">
            {packages?.map((p) => (
              <Card key={p.id} className="border-0 shadow-none">
                <CardHeader className="py-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <Package className="size-4" />
                    <span className="font-mono">{p.barcode}</span>
                    <Badge variant="outline">
                      {t("statusBadge")} {String(p.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {p.id}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {!packagesLoading && packages?.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("noPackages")}</p>
      )}
    </div>
  );
}
