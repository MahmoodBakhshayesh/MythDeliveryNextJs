export type VehicleTypePreset = {
  key: string;
  label: string;
  vehicleType: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  maxStopsPerRoute: number;
  range: {
    maxWeightKg: { min: number; max: number };
    maxVolumeM3: { min: number; max: number };
    maxStopsPerRoute: { min: number; max: number };
  };
};

export const CUSTOM_VEHICLE_TYPE_KEY = "custom";

export const VEHICLE_TYPE_PRESETS: VehicleTypePreset[] = [
  {
    key: "motorbike",
    label: "Motorbike",
    vehicleType: "Motorbike",
    maxWeightKg: 35,
    maxVolumeM3: 0.25,
    maxStopsPerRoute: 25,
    range: {
      maxWeightKg: { min: 1, max: 120 },
      maxVolumeM3: { min: 0.05, max: 0.8 },
      maxStopsPerRoute: { min: 1, max: 50 },
    },
  },
  {
    key: "sedan",
    label: "Sedan",
    vehicleType: "Sedan",
    maxWeightKg: 250,
    maxVolumeM3: 1.8,
    maxStopsPerRoute: 35,
    range: {
      maxWeightKg: { min: 50, max: 600 },
      maxVolumeM3: { min: 0.5, max: 4 },
      maxStopsPerRoute: { min: 1, max: 80 },
    },
  },
  {
    key: "van",
    label: "Van",
    vehicleType: "Van",
    maxWeightKg: 1200,
    maxVolumeM3: 8,
    maxStopsPerRoute: 50,
    range: {
      maxWeightKg: { min: 300, max: 2500 },
      maxVolumeM3: { min: 2, max: 14 },
      maxStopsPerRoute: { min: 1, max: 120 },
    },
  },
  {
    key: "truck",
    label: "Truck",
    vehicleType: "Truck",
    maxWeightKg: 3500,
    maxVolumeM3: 15,
    maxStopsPerRoute: 40,
    range: {
      maxWeightKg: { min: 800, max: 18000 },
      maxVolumeM3: { min: 5, max: 60 },
      maxStopsPerRoute: { min: 1, max: 200 },
    },
  },
];

export function getPresetByKey(key: string | null | undefined) {
  if (!key) return null;
  return VEHICLE_TYPE_PRESETS.find((p) => p.key === key) ?? null;
}

const CUSTOM_RANGE = {
  maxWeightKg: { min: 1, max: 30000 },
  maxVolumeM3: { min: 0.01, max: 200 },
  maxStopsPerRoute: { min: 1, max: 500 },
};

export function validateVehicleCapacities(
  presetKey: string,
  values: {
    maxWeightKg: number;
    maxVolumeM3: number;
    maxStopsPerRoute: number;
  },
): string | null {
  const preset = getPresetByKey(presetKey);
  const range = preset?.range ?? CUSTOM_RANGE;

  if (
    values.maxWeightKg < range.maxWeightKg.min ||
    values.maxWeightKg > range.maxWeightKg.max
  ) {
    return `Weight must be between ${range.maxWeightKg.min} and ${range.maxWeightKg.max} kg for this vehicle type.`;
  }
  if (
    values.maxVolumeM3 < range.maxVolumeM3.min ||
    values.maxVolumeM3 > range.maxVolumeM3.max
  ) {
    return `Volume must be between ${range.maxVolumeM3.min} and ${range.maxVolumeM3.max} m3 for this vehicle type.`;
  }
  if (
    values.maxStopsPerRoute < range.maxStopsPerRoute.min ||
    values.maxStopsPerRoute > range.maxStopsPerRoute.max
  ) {
    return `Max stops must be between ${range.maxStopsPerRoute.min} and ${range.maxStopsPerRoute.max} for this vehicle type.`;
  }
  return null;
}
