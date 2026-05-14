"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamDirectorySnapshot } from "@/features/team/controllers/team-directory.controller";
import type { UserDirectoryEntry } from "@/types/api";

function hasRole(roles: readonly string[], role: string): boolean {
  const want = role.toLowerCase();
  return roles.some((r) => String(r).trim().toLowerCase() === want);
}

function groupSupervisorsByOrg(
  users: UserDirectoryEntry[],
  orgNames: Map<string, string>,
): { orgId: string; orgName: string; users: UserDirectoryEntry[] }[] {
  const supervisors = users.filter((u) => hasRole(u.roles, "supervisor"));
  const map = new Map<string, UserDirectoryEntry[]>();
  for (const u of supervisors) {
    const orgIds = u.organizationIds?.length ? u.organizationIds : [];
    if (orgIds.length === 0) {
      const key = "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
      continue;
    }
    for (const oid of orgIds) {
      if (!map.has(oid)) map.set(oid, []);
      map.get(oid)!.push(u);
    }
  }
  return [...map.entries()]
    .map(([orgId, list]) => ({
      orgId,
      orgName:
        orgId === "_none"
          ? "—"
          : orgNames.get(orgId) ?? orgId.slice(0, 8),
      users: list,
    }))
    .sort((a, b) => a.orgName.localeCompare(b.orgName));
}

export function TeamDirectoryView({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: Error | null;
  data: TeamDirectorySnapshot | null;
}) {
  const t = useTranslations("UiTeam");

  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of data?.orgs ?? []) m.set(o.id, o.name);
    return m;
  }, [data?.orgs]);

  const admins = useMemo(
    () => (data?.users ?? []).filter((u) => hasRole(u.roles, "admin")),
    [data?.users],
  );

  const supervisorsGrouped = useMemo(
    () => (data?.users ? groupSupervisorsByOrg(data.users, orgNameById) : []),
    [data?.users, orgNameById],
  );

  const managersFlat = useMemo(() => {
    const rows: {
      organizationName: string;
      depot: string;
      userName: string;
      email: string | null | undefined;
      displayName: string | null | undefined;
    }[] = [];
    for (const block of data?.managersByOrg ?? []) {
      for (const m of block.managers) {
        rows.push({
          organizationName: block.organizationName,
          depot: m.distributionCenterName,
          userName: m.userName,
          email: m.email,
          displayName: m.displayName,
        });
      }
    }
    rows.sort((a, b) => {
      const o = a.organizationName.localeCompare(b.organizationName);
      if (o !== 0) return o;
      const d = a.depot.localeCompare(b.depot);
      if (d !== 0) return d;
      const u = a.userName.localeCompare(b.userName);
      if (u !== 0) return u;
      return (a.email ?? "").localeCompare(b.email ?? "");
    });
    return rows;
  }, [data?.managersByOrg]);

  const driversGrouped = useMemo(() => {
    type Row = {
      orgName: string;
      depot: string;
      displayName: string;
      phone: string | null | undefined;
    };
    const rows: Row[] = [];
    for (const block of data?.driversByOrg ?? []) {
      for (const d of block.drivers) {
        const depot =
          block.distributionCenters.find((c) => c.id === d.distributionCenterId)?.name ??
          d.distributionCenterId.slice(0, 8);
        rows.push({
          orgName: block.organizationName,
          depot,
          displayName: d.displayName,
          phone: d.phone,
        });
      }
    }
    rows.sort((a, b) => {
      const o = a.orgName.localeCompare(b.orgName);
      if (o !== 0) return o;
      const dc = a.depot.localeCompare(b.depot);
      if (dc !== 0) return dc;
      return a.displayName.localeCompare(b.displayName);
    });
    return rows;
  }, [data?.driversByOrg]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>{t("loadErrorTitle")}</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          {t("editHint")}{" "}
          <Link href="/users" className="text-primary underline-offset-4 hover:underline">
            /users
          </Link>
          ,{" "}
          <Link href="/managers" className="text-primary underline-offset-4 hover:underline">
            /managers
          </Link>
          ,{" "}
          <Link href="/drivers" className="text-primary underline-offset-4 hover:underline">
            /drivers
          </Link>
          .
        </p>
      </div>

      <Tabs defaultValue="admins" className="w-full">
        <TabsList className="flex h-auto min-h-10 w-full flex-wrap gap-1 md:grid md:grid-cols-4">
          <TabsTrigger value="admins">{t("tabAdmins")}</TabsTrigger>
          <TabsTrigger value="supervisors">{t("tabSupervisors")}</TabsTrigger>
          <TabsTrigger value="managers">{t("tabManagers")}</TabsTrigger>
          <TabsTrigger value="drivers">{t("tabDrivers")}</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="mt-4 space-y-4">
          {admins.length ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t("userName")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("email")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("roles")}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{u.userName}</td>
                      <td className="text-muted-foreground px-3 py-2">{u.email ?? "—"}</td>
                      <td className="text-muted-foreground px-3 py-2">{u.roles.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("emptyAdmins")}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="supervisors" className="mt-4 space-y-8">
          {supervisorsGrouped.some((g) => g.users.length) ? (
            supervisorsGrouped.map((g) =>
              g.users.length ? (
                <section key={g.orgId} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {t("orgHeading", { name: g.orgName })}
                  </h2>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-3 py-2 text-start font-medium">{t("userName")}</th>
                          <th className="px-3 py-2 text-start font-medium">{t("email")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.users.map((u) => (
                          <tr key={`${g.orgId}-${u.id}`} className="border-t">
                            <td className="px-3 py-2 font-medium">{u.userName}</td>
                            <td className="text-muted-foreground px-3 py-2">{u.email ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null,
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("emptySupervisors")}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="managers" className="mt-4">
          {managersFlat.length ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t("organization")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("depot")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("userName")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("email")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("displayName")}</th>
                  </tr>
                </thead>
                <tbody>
                  {managersFlat.map((row, i) => (
                    <tr key={`${row.organizationName}-${row.depot}-${row.userName}-${i}`} className="border-t">
                      <td className="px-3 py-2">{row.organizationName}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.depot}</td>
                      <td className="px-3 py-2 font-medium">{row.userName}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.email?.trim() || "—"}</td>
                      <td className="text-muted-foreground px-3 py-2">
                        {row.displayName?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("emptyManagers")}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          {driversGrouped.length ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t("organization")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("depot")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("displayName")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("phone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {driversGrouped.map((row, i) => (
                    <tr key={`${row.orgName}-${row.displayName}-${i}`} className="border-t">
                      <td className="px-3 py-2">{row.orgName}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.depot}</td>
                      <td className="px-3 py-2 font-medium">{row.displayName}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("emptyDrivers")}</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
