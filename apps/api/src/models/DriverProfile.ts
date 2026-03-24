import mongoose, { Schema } from "mongoose";
import {
  DRIVER_APPROVAL_STATUSES,
  DRIVER_AVAILABILITY,
  VEHICLE_TYPES,
  type DriverApprovalStatus,
  type DriverAvailability,
  type VehicleType
} from "@loadgo/shared";

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    kind: { type: String, enum: ["license", "vehicle_rc", "profile_photo"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, required: true }
  },
  { _id: false }
);

const driverProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES satisfies readonly VehicleType[], required: true },
    approvalStatus: {
      type: String,
      enum: DRIVER_APPROVAL_STATUSES satisfies readonly DriverApprovalStatus[],
      default: "pending",
      index: true
    },
    availability: {
      type: String,
      enum: DRIVER_AVAILABILITY satisfies readonly DriverAvailability[],
      default: "offline",
      index: true
    },
    documents: { type: [documentSchema], default: [] },
    earningsToday: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    currentLocation: { type: geoPointSchema, index: "2dsphere" },
    lastLocationAt: { type: Date },
    currentAddress: { type: String },
    isGpsTrusted: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const DriverProfileModel = mongoose.model("DriverProfile", driverProfileSchema);
