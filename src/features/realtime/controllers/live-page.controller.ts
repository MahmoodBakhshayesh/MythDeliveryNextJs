"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { PackageStatusPayload } from "@/features/realtime/domain/package-status.types";
import { openDeliveryTrackingSessionUseCase } from "@/features/realtime/usecases/delivery-tracking-session.usecase";
import { listOrganizationsUseCase } from "@/features/organizations/usecases/list-organizations.usecase";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export type ConnectionState = "idle" | "connecting" | "live" | "error";

export function useLivePageController() {
  const token = useAuthStore((s) => s.accessToken);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [events, setEvents] = useState<PackageStatusPayload[]>([]);
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [hubError, setHubError] = useState<string | null>(null);

  const orgsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => listOrganizationsUseCase(),
  });

  const orgs = orgsQuery.data;
  const firstOrgId = orgs?.[0]?.id;

  useEffect(() => {
    if (!selectedOrgId && firstOrgId) setSelectedOrgId(firstOrgId);
  }, [firstOrgId, selectedOrgId]);

  const effectiveOrgId = selectedOrgId || firstOrgId || "";

  useEffect(() => {
    if (!effectiveOrgId || !token) {
      setConnState("idle");
      return;
    }

    let teardown: (() => Promise<void>) | undefined;

    setConnState("connecting");
    setHubError(null);

    void openDeliveryTrackingSessionUseCase(
      token,
      effectiveOrgId,
      (payload) =>
        setEvents((prev) => [payload, ...prev].slice(0, 200)),
      (err) => {
        if (err) setHubError(err.message);
      },
    )
      .then((t) => {
        teardown = t;
        setConnState("live");
      })
      .catch((e: Error) => {
        setHubError(e.message);
        setConnState("error");
      });

    return () => {
      void teardown?.();
    };
  }, [effectiveOrgId, token]);

  return {
    viewState: {
      organizations: orgs ?? null,
      selectedOrgId: effectiveOrgId,
      events,
      connState,
      hubError,
      orgsLoading: orgsQuery.isLoading,
    },
    actions: {
      setOrgId: (id: string | null) => setSelectedOrgId(id ?? ""),
    },
  };
}

export type LivePageViewModel = ReturnType<typeof useLivePageController>;
