"use client";

import { Radio } from "lucide-react";
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
          Live tracking
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          SignalR hub{" "}
          <code className="rounded bg-muted px-1">/hubs/delivery-tracking</code>{" "}
          — subscribes via{" "}
          <code className="rounded bg-muted px-1">SubscribeOrganization</code>.
          Events:{" "}
          <code className="rounded bg-muted px-1">packageStatus</code>.
        </p>
      </div>

      <div className="max-w-md space-y-2">
        <Label>Organization</Label>
        <Select
          value={selectedOrgId || undefined}
          onValueChange={(v) => actions.setOrgId(v)}
          disabled={orgsLoading || !organizations?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select organization" />
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
              — {e.barcode} — status {e.status}
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-muted-foreground p-4 text-center text-sm">
              Waiting for package updates…
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
