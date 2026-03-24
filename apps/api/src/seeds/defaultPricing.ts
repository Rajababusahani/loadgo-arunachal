import { VEHICLE_TYPES } from "@loadgo/shared";
import { DEFAULT_PRICING } from "../constants/defaultPricing";
import { PricingConfigModel } from "../models/PricingConfig";

export async function seedDefaultPricing(): Promise<void> {
  await Promise.all(
    VEHICLE_TYPES.map(async (vehicleType) => {
      await PricingConfigModel.findOneAndUpdate(
        { vehicleType },
        {
          $setOnInsert: {
            vehicleType,
            baseFare: DEFAULT_PRICING[vehicleType].baseFare,
            perKmRate: DEFAULT_PRICING[vehicleType].perKmRate,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
    })
  );
}
