export type DeliveryPackageResponse = {
  id: string;
  organizationId: string;
  deliveryStopId: string;
  deliveryLineItemIds: string[];
  barcode: string;
  status: number | string;
  statusChangedAtUtc: string;
  lastHandledByDriverId?: string | null;
  notes?: string | null;
};
