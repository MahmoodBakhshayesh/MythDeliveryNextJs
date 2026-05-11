"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
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
import type { ManagersPageViewModel } from "@/features/managers/controllers/managers-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ManagersPageView({ viewState, actions }: ManagersPageViewModel) {
  const t = useTranslations("UiManagers");
  const tc = useTranslations("Common");

  const {
    organizations,
    selectedOrgId,
    distributionCenters,
    managers,
    orgsLoading,
    distributionCentersLoading,
    managersLoading,
    dialogOpen,
    email,
    userName,
    displayName,
    phone,
    password,
    passwordConfirm,
    distributionCenterId,
    addPending,
    deletePending,
  } = viewState;

  const loading = orgsLoading || distributionCentersLoading || managersLoading;

  const managersByDepot = useMemo(() => {
    const list = managers ?? [];
    const map = new Map<string, typeof list>();
    for (const m of list) {
      const key = m.distributionCenterName?.trim() || m.distributionCenterId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [managers]);

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
          disabled={!organizations?.length || !(distributionCenters?.length)}
        >
          <Plus className="me-2 size-4" />
          {t("addManager")}
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
      ) : managersByDepot.length ? (
        <div className="space-y-8">
          {managersByDepot.map(([depotName, rows]) => (
            <section key={depotName} className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
                {t("depotHeading", { name: depotName })}
              </h2>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr className="text-start">
                      <th className="px-3 py-2 font-medium">{t("email")}</th>
                      <th className="px-3 py-2 font-medium">{tc("name")}</th>
                      <th className="px-3 py-2 font-medium w-[100px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{m.email}</td>
                        <td className="text-muted-foreground px-3 py-2">
                          {m.displayName?.trim() || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("remove")}
                              disabled={deletePending}
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  !window.confirm(t("removeConfirm"))
                                )
                                  return;
                                actions.deleteManager(m.id);
                              }}
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription>{t("emptyDesc")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={actions.setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("depot")}</Label>
              <Select
                value={distributionCenterId}
                onValueChange={(v) => actions.setDistributionCenterId(v ?? "")}
                disabled={!distributionCenters?.length}
                items={(distributionCenters ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("depotPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {distributionCenters?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-email">{t("email")}</Label>
              <Input
                id="mgr-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => actions.setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-username">{t("userNameOptional")}</Label>
              <Input
                id="mgr-username"
                value={userName}
                onChange={(e) => actions.setUserName(e.target.value)}
                placeholder={t("userNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-display">{t("displayNameOptional")}</Label>
              <Input
                id="mgr-display"
                value={displayName}
                onChange={(e) => actions.setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-phone">{t("phoneOptional")}</Label>
              <Input
                id="mgr-phone"
                value={phone}
                onChange={(e) => actions.setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-pw">{t("password")}</Label>
              <Input
                id="mgr-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => actions.setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-pw2">{t("passwordConfirm")}</Label>
              <Input
                id="mgr-pw2"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => actions.setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => actions.setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={() => actions.submitManager()} disabled={addPending}>
              {addPending ? tc("creating") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
