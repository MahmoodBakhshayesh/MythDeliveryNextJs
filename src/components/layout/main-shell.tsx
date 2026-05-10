"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Truck,
  Package,
  Radio,
  UserRound,
  LogOut,
  Menu,
  Users,
  UserCircle,
  ClipboardList,
  CalendarClock,
  Waypoints,
  Files,
  Warehouse,
  ShieldAlert,
  Database,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLogoutController } from "@/features/auth/controllers/logout.controller";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useCanDriverSelfService } from "@/lib/use-can-driver-self-service";
import { useCanFleetOperations } from "@/lib/use-can-fleet-operations";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function NavLinks({
  items,
  onNavigate,
  className,
}: {
  items: ShellNavItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MainShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useLogoutController();
  const username = useAuthStore((s) => s.username);
  const t = useTranslations("Nav");
  const tc = useTranslations("Common");
  const isAdmin = useIsAdmin();
  const fleet = useCanFleetOperations();
  const driverPortal = useCanDriverSelfService();
  const pureDriver = driverPortal && !fleet;
  const homeHref = pureDriver ? "/driver" : "/dashboard";

  const navItems = useMemo((): ShellNavItem[] => {
    if (pureDriver) {
      return [
        { href: "/driver", label: t("driverHome"), icon: LayoutDashboard },
        { href: "/driver/profile", label: t("driverProfile"), icon: UserRound },
        { href: "/driver/vehicles", label: t("driverVehicles"), icon: Car },
      ];
    }

    const items: ShellNavItem[] = [
      { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { href: "/organizations", label: t("organizations"), icon: Building2 },
    ];
    if (isAdmin) {
      items.push({ href: "/users", label: t("users"), icon: Users });
      items.push({
        href: "/admin",
        label: t("adminConsole"),
        icon: ShieldAlert,
      });
      items.push({
        href: "/admin/operations",
        label: t("adminOperations"),
        icon: Database,
      });
    }
    items.push(
      { href: "/plan-workflow", label: t("planWorkflow"), icon: Waypoints },
      { href: "/fleet-plans", label: t("fleetPlans"), icon: Files },
      { href: "/work-plans", label: t("workPlansTemplates"), icon: CalendarClock },
      { href: "/deliveries", label: t("deliveries"), icon: ClipboardList },
      { href: "/drivers", label: t("drivers"), icon: UserCircle },
      { href: "/fleet", label: t("fleet"), icon: Truck },
      { href: "/storages", label: t("storages"), icon: Warehouse },
      { href: "/packages", label: t("packages"), icon: Package },
      { href: "/live", label: t("live"), icon: Radio },
      { href: "/profile", label: t("profile"), icon: UserRound },
    );
    if (driverPortal) {
      items.push({
        href: "/driver",
        label: t("driverWorkspace"),
        icon: Car,
      });
    }
    return items;
  }, [t, isAdmin, pureDriver, driverPortal]);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="hidden w-64 shrink-0 border-e bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href={homeHref} className="font-semibold tracking-tight">
            {t("brand")}
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <LocaleSwitcher />
          <NavLinks items={navItems} />
          <Separator className="my-2 bg-sidebar-border" />
          <p className="truncate px-3 text-xs text-muted-foreground">
            {username ?? tc("userFallback")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label={t("openMenu")}>
                  <Menu className="size-4" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("brand")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <LocaleSwitcher />
                <NavLinks
                  items={navItems}
                  onNavigate={() => setMobileOpen(false)}
                />
                <Separator />
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                >
                  <LogOut className="me-2 size-4" />
                  {t("logout")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-medium">{t("brand")}</span>
          <div className="ms-auto w-[140px] shrink-0">
            <LocaleSwitcher />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
