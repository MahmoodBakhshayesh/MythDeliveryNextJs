/** Mirrors MythDeliveryWebApi DeliveryPackageRealtimePayload (camelCase JSON). */
export type PackageStatusPayload = {
  packageId: string;
  organizationId: string;
  deliveryStopId: string;
  barcode: string;
  status: number;
  statusChangedAtUtc: string;
  lastHandledByDriverId?: string | null;
};
