import mongoose, { Schema } from "mongoose";
import { VEHICLE_TYPES, type VehicleType } from "@loadgo/shared";

const pricingConfigSchema = new Schema(
  {
    vehicleType: { type: String, enum: VEHICLE_TYPES satisfies readonly VehicleType[], required: true, unique: true },
    baseFare: { type: Number, required: true },
    perKmRate: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const PricingConfigModel = mongoose.model("PricingConfig", pricingConfigSchema);
