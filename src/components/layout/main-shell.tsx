"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  MapPinned,
  Users,
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
  const navItems = useMemo((): ShellNavItem[] => {
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/organizations", label: "Organizations", icon: Building2 },
      { href: "/users", label: "Users", icon: Users },
      { href: "/map", label: "Planning map", icon: MapPinned },
      { href: "/fleet", label: "Fleet", icon: Truck },
      { href: "/packages", label: "Packages", icon: Package },
      { href: "/live", label: "Live tracking", icon: Radio },
      { href: "/profile", label: "Profile", icon: UserRound },
    ];
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Myth Delivery
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <NavLinks items={navItems} />
          <Separator className="my-2 bg-sidebar-border" />
          <p className="truncate px-3 text-xs text-muted-foreground">
            {username ?? "User"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Myth Delivery</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
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
                  <LogOut className="mr-2 size-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-medium">Myth Delivery</span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
