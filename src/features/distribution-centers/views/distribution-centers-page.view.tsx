"use client";

import { Pencil, Plus } from "lucide-react";
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
import type { DistributionCentersPageViewModel } from "@/features/distribution-centers/controllers/distribution-centers-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DistributionCentersPageView({
  viewState,
  actions,
}: DistributionCentersPageViewModel) {
  const t = useTranslations("UiDistributionCenters");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    distributionCenters,
    orgsLoading,
    distributionCentersLoading,
    dialogOpen,
    dialogMode,
    isDcManagerOnly,
    centerName,
    latitude,
    longitude,
    savePending,
  } = viewState;

  const loading = orgsLoading || distributionCentersLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
          {isDcManagerOnly ? (
            <p className="text-muted-foreground mt-2 max-w-xl text-xs">
              {t("managerScopeHint")}
            </p>
          ) : null}
        </div>
        {!isDcManagerOnly ? (
          <Button
            type="button"
            onClick={() => actions.openAddDialog()}
            disabled={!organizations?.length}
          >
            <Plus className="me-2 size-4" />
            {t("addDistributionCenter")}
          </Button>
        ) : null}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {distributionCenters?.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription>
                    {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={t("editDistributionCenter")}
                  onClick={() => actions.openEditDialog(s)}
                >
                  <Pencil className="size-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
          {!distributionCenters?.length ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : null}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={actions.handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? t("editDialogTitle") : t("dialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dc-name">{tc("name")}</Label>
              <Input
                id="dc-name"
                value={centerName}
                onChange={(e) => actions.setCenterName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dc-lat">{t("latitude")}</Label>
                <Input
                  id="dc-lat"
                  value={latitude}
                  onChange={(e) => actions.setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dc-lng">{t("longitude")}</Label>
                <Input
                  id="dc-lng"
                  value={longitude}
                  onChange={(e) => actions.setLongitude(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => actions.handleDialogOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => actions.submitDistributionCenter()}
              disabled={savePending}
            >
              {savePending
                ? dialogMode === "edit"
                  ? tc("saving")
                  : tc("creating")
                : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
