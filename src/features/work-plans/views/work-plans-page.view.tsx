"use client";

import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkPlansPageViewModel } from "@/features/work-plans/controllers/work-plans-page.controller";

function shiftSummary(shifts: { ordinal: number; localStart: string; localEnd: string }[]) {
  return [...shifts]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((s) => `#${s.ordinal} ${s.localStart}-${s.localEnd}`)
    .join(" · ");
}

export function WorkPlansPageView({ viewState, actions }: WorkPlansPageViewModel) {
  const t = useTranslations("UiWorkPlans");
  const tc = useTranslations("Common");

  const {
    organizations,
    selectedOrgId,
    plans,
    orgsLoading,
    plansLoading,
    newPlanName,
    shiftRows,
    createPending,
    deletePendingId,
  } = viewState;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          {t("subtitle")}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("createTitle")}</CardTitle>
          <CardDescription>{t("createHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wp-name">{tc("name")}</Label>
            <Input
              id="wp-name"
              value={newPlanName}
              onChange={(e) => actions.setNewPlanName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t("shiftsLabel")}</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => actions.addShiftRow()}>
                {t("addShift")}
              </Button>
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              {shiftRows.map((row) => (
                <div
                  key={row.ordinal}
                  className="flex flex-wrap items-end gap-2 border-b pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground mb-2 text-xs font-medium">
                    #{row.ordinal}
                  </span>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("shiftStart")}</Label>
                    <Input
                      type="time"
                      value={row.localStart.slice(0, 5)}
                      onChange={(e) =>
                        actions.updateShiftRow(row.ordinal, {
                          localStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("shiftEnd")}</Label>
                    <Input
                      type="time"
                      value={row.localEnd.slice(0, 5)}
                      onChange={(e) =>
                        actions.updateShiftRow(row.ordinal, {
                          localEnd: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mb-0.5"
                    disabled={shiftRows.length <= 1}
                    onClick={() => actions.removeShiftRow(row.ordinal)}
                  >
                    {t("removeShift")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button
            type="button"
            onClick={() => actions.createPlan()}
            disabled={createPending || !selectedOrgId}
          >
            {createPending ? tc("creating") : t("create")}
          </Button>
          <p className="text-muted-foreground text-xs">
            {t("wizardLinkPrefix")}{" "}
            <Link href="/plan-workflow" className="text-primary underline">
              {t("wizardLink")}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("listTitle")}</CardTitle>
          <CardDescription>{t("listHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b text-start">
                    <th className="px-3 py-2 font-medium">{tc("name")}</th>
                    <th className="px-3 py-2 font-medium">{t("colShifts")}</th>
                    <th className="px-3 py-2 font-medium w-[100px]">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="text-muted-foreground max-w-xl px-3 py-2 whitespace-normal">
                        {shiftSummary(p.shifts)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletePendingId === p.id}
                          onClick={() => actions.deletePlan(p.id)}
                        >
                          {t("deleteAction")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
