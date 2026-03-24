import { calculateEstimatedPrice, type VehicleType } from "@loadgo/shared";
import { PricingConfigModel } from "../models/PricingConfig";
import { ApiError } from "../utils/api-error";

export async function getPricingRule(vehicleType: VehicleType) {
  const pricing = await PricingConfigModel.findOne({ vehicleType, isActive: true }).lean();
  if (!pricing) {
    throw new ApiError(404, `Pricing not configured for ${vehicleType}`);
  }

  return pricing;
}

export async function buildPricingBreakdown(vehicleType: VehicleType, distanceKm: number, durationMinutes: number) {
  const pricing = await getPricingRule(vehicleType);
  const estimatedPrice = calculateEstimatedPrice(pricing.baseFare, pricing.perKmRate, distanceKm);

  return {
    vehicleType,
    distanceKm,
    durationMinutes,
    baseFare: pricing.baseFare,
    perKmRate: pricing.perKmRate,
    estimatedPrice,
    currency: "INR" as const
  };
}
