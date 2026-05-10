"use client";

import Link from "next/link";
import {
  Building2,
  Package,
  Radio,
  Truck,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiles = [
  {
    title: "Organizations",
    desc: "Browse sandbox and tenant orgs.",
    href: "/organizations",
    icon: Building2,
  },
  {
    title: "Fleet",
    desc: "Vehicles, drivers, planning windows.",
    href: "/fleet",
    icon: Truck,
  },
  {
    title: "Packages",
    desc: "Track deliveries and QR labels.",
    href: "/packages",
    icon: Package,
  },
  {
    title: "Live tracking",
    desc: "SignalR feed for package status.",
    href: "/live",
    icon: Radio,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
          Myth Delivery console — wired to your ASP.NET Core API via React Query,
          Zustand auth, and SignalR for realtime updates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map(({ title, desc, href, icon: Icon }) => (
          <Card key={href} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-5 opacity-80" />
                  {title}
                </CardTitle>
                <CardDescription>{desc}</CardDescription>
              </div>
              <Link
                href={href}
                aria-label={title}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                )}
              >
                <ArrowRight className="size-4" />
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
