"use client";

import { Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { FleetPageViewModel } from "@/features/fleet/controllers/fleet-page.controller";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function FleetPageView({ viewState, actions }: FleetPageViewModel) {
  const {
    organizations,
    selectedOrgId,
    vehicles,
    orgsLoading,
    vehiclesLoading,
    isAdmin,
    vehicleDialogOpen,
    vehicleName,
    plateNumber,
    vehicleType,
    addVehiclePending,
  } = viewState;

  const loading = orgsLoading || vehiclesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Fleet</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Vehicles from{" "}
            <code className="rounded bg-muted px-1">
              GET /api/vehicles?organizationId=
            </code>
          </p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => actions.setVehicleDialogOpen(true)}
            disabled={!organizations?.length}
          >
            <Plus className="mr-2 size-4" />
            Add vehicle
          </Button>
        ) : null}
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

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles?.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {v.name}
                  <Badge variant={v.isActive ? "default" : "secondary"}>
                    {v.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {v.plateNumber ?? "—"} · {v.vehicleType ?? "Vehicle"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {!vehiclesLoading && vehicles?.length === 0 && (
        <p className="text-muted-foreground text-sm">No vehicles for this org.</p>
      )}

      <Dialog open={vehicleDialogOpen} onOpenChange={actions.setVehicleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="v-name">Name</Label>
              <Input
                id="v-name"
                value={vehicleName}
                onChange={(e) => actions.setVehicleName(e.target.value)}
                placeholder="Vehicle name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-plate">Plate (optional)</Label>
              <Input
                id="v-plate"
                value={plateNumber}
                onChange={(e) => actions.setPlateNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-type">Type (optional)</Label>
              <Input
                id="v-type"
                value={vehicleType}
                onChange={(e) => actions.setVehicleType(e.target.value)}
                placeholder="Van, truck…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => actions.setVehicleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={addVehiclePending}
              onClick={() => actions.submitVehicle()}
            >
              {addVehiclePending ? "Saving…" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
