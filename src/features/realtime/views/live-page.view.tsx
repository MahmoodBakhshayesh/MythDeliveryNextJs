"use client";



import { Radio } from "lucide-react";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import { ScrollArea } from "@/components/ui/scroll-area";

import type { LivePageViewModel } from "@/features/realtime/controllers/live-page.controller";



export function LivePageView({ viewState, actions }: LivePageViewModel) {

  const t = useTranslations("UiLive");

  const tc = useTranslations("Common");

  const {

    organizations,

    selectedOrgId,

    events,

    connState,

    hubError,

    orgsLoading,

  } = viewState;



  return (

    <div className="space-y-6">

      <div>

        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">

          <Radio className="size-7" />

          {t("title")}

        </h1>

        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">

          {t("subtitle")}{" "}

          <code className="rounded bg-muted px-1">/hubs/delivery-tracking</code>{" "}

          {t("subtitleSubscribe")}{" "}

          <code className="rounded bg-muted px-1">SubscribeOrganization</code>.{" "}

          {t("subtitleEvents")}{" "}

          <code className="rounded bg-muted px-1">packageStatus</code>.

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



      <div className="flex flex-wrap items-center gap-2">

        <Badge variant={connState === "live" ? "default" : "secondary"}>

          {connState}

        </Badge>

        {hubError && (

          <span className="text-destructive text-sm">{hubError}</span>

        )}

      </div>



      <ScrollArea className="h-[min(520px,70vh)] rounded-lg border">

        <ul className="divide-y p-2 text-sm">

          {events.map((e, i) => (

            <li key={`${e.packageId}-${i}`} className="py-2 font-mono text-xs">

              <span className="text-muted-foreground">

                {new Date(e.statusChangedAtUtc).toLocaleTimeString()}

              </span>{" "}

              — {e.barcode} — {t("eventLineStatus")} {e.status}

            </li>

          ))}

          {events.length === 0 && (

            <li className="text-muted-foreground p-4 text-center text-sm">

              {t("waitingUpdates")}

            </li>

          )}

        </ul>

      </ScrollArea>

    </div>

  );

}

