import type {
  DeliveryStopResponseDto,
  UpdateDeliveryStopBody,
} from "@/features/map/domain/planning-map.types";

type Patch = Partial<
  Pick<
    DeliveryStopResponseDto,
    | "recipientName"
    | "phone"
    | "addressLine1"
    | "city"
    | "region"
    | "postalCode"
    | "country"
    | "latitude"
    | "longitude"
    | "serviceDate"
    | "timeSection"
    | "orderId"
    | "notes"
    | "externalRef"
    | "weightKg"
    | "volumeM3"
    | "lengthCm"
    | "widthCm"
    | "heightCm"
    | "planningWindowId"
  >
>;

export function deliveryStopToUpdateBody(
  stop: DeliveryStopResponseDto,
  patch?: Patch,
): UpdateDeliveryStopBody {
  const m = { ...stop, ...patch };
  return {
    planningWindowId: m.planningWindowId ?? null,
    recipientName: (m.recipientName ?? "").trim() || "Stop",
    phone: m.phone?.trim() || null,
    addressLine1: m.addressLine1?.trim() || null,
    city: m.city?.trim() || null,
    region: m.region?.trim() || null,
    postalCode: m.postalCode?.trim() || null,
    country: m.country?.trim() || null,
    latitude: m.latitude,
    longitude: m.longitude,
    weightKg: m.weightKg ?? null,
    volumeM3: m.volumeM3 ?? null,
    lengthCm: m.lengthCm ?? null,
    widthCm: m.widthCm ?? null,
    heightCm: m.heightCm ?? null,
    serviceDate: m.serviceDate ?? null,
    timeSection: m.timeSection ?? null,
    orderId: m.orderId?.trim() || null,
    notes: m.notes?.trim() || null,
    externalRef: m.externalRef?.trim() || null,
  };
}
