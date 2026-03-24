import { VEHICLE_TYPES } from "@loadgo/shared";

export const DEFAULT_PRICING: Record<(typeof VEHICLE_TYPES)[number], { baseFare: number; perKmRate: number }> = {
  bike: { baseFare: 60, perKmRate: 14 },
  mini_truck: { baseFare: 180, perKmRate: 28 },
  pickup_truck: { baseFare: 260, perKmRate: 35 }
};
