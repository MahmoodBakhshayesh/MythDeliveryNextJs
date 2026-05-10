"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { maintenanceRepository } from "@/features/admin/repositories/maintenance.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminOperationsPage() {
  const t = useTranslations("UiAdmin");
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [confirmed, setConfirmed] = useState(false);

  const mutation = useMutation({
    mutationFn: () => maintenanceRepository.clearOperationalData(),
    onSuccess: (res) => {
      if (!isAppSuccess(res)) {
        toast.error(appErrorMessage(res));
        return;
      }
      toast.success(res.body?.message ?? t("successRedirect"));
      clearSession();
      router.replace("/login");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Request failed"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("operationsTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t("operationsIntro")}</p>
        <p className="text-muted-foreground mt-2 text-xs">{t("disabledHint")}</p>
      </header>

      <div className="space-y-4 rounded-xl border border-destructive/50 bg-destructive/5 p-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="border-input mt-1 size-4 rounded border"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>{t("confirmLabel")}</span>
        </label>
        <div>
          <Label className="sr-only">{t("runReset")}</Label>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("running") : t("runReset")}
          </Button>
        </div>
      </div>
    </div>
  );
}
