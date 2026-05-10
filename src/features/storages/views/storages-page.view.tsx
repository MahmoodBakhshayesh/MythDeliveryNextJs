"use client";

import { Plus } from "lucide-react";
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
import type { StoragesPageViewModel } from "@/features/storages/controllers/storages-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function StoragesPageView({ viewState, actions }: StoragesPageViewModel) {
  const t = useTranslations("UiStorages");
  const tc = useTranslations("Common");
  const {
    organizations,
    selectedOrgId,
    storages,
    orgsLoading,
    storagesLoading,
    dialogOpen,
    storageName,
    latitude,
    longitude,
    addPending,
  } = viewState;

  const loading = orgsLoading || storagesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          onClick={() => actions.setDialogOpen(true)}
          disabled={!organizations?.length}
        >
          <Plus className="me-2 size-4" />
          {t("addStorage")}
        </Button>
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
          {storages?.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{s.name}</CardTitle>
                <CardDescription>
                  {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
          {!storages?.length ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : null}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={actions.setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="st-name">{tc("name")}</Label>
              <Input
                id="st-name"
                value={storageName}
                onChange={(e) => actions.setStorageName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="st-lat">{t("latitude")}</Label>
                <Input
                  id="st-lat"
                  value={latitude}
                  onChange={(e) => actions.setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="st-lng">{t("longitude")}</Label>
                <Input
                  id="st-lng"
                  value={longitude}
                  onChange={(e) => actions.setLongitude(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => actions.setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={() => actions.submitStorage()} disabled={addPending}>
              {addPending ? tc("creating") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
