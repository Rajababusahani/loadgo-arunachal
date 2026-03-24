import mongoose, { Schema } from "mongoose";
import {
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  VEHICLE_TYPES,
  type BookingStatus,
  type PaymentMethod,
  type PaymentStatus,
  type VehicleType
} from "@loadgo/shared";

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const stopSchema = new Schema(
  {
    address: { type: String, required: true },
    landmark: { type: String },
    point: { type: geoPointSchema, required: true }
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    pickup: { type: stopSchema, required: true },
    drop: { type: stopSchema, required: true },
    distanceKm: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    estimatedPrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES satisfies readonly VehicleType[], required: true },
    status: { type: String, enum: BOOKING_STATUSES satisfies readonly BookingStatus[], default: "created", index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS satisfies readonly PaymentMethod[], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES satisfies readonly PaymentStatus[], default: "pending" },
    notes: { type: String },
    candidateDriverIds: { type: [Schema.Types.ObjectId], default: [] },
    rejectedDriverIds: { type: [Schema.Types.ObjectId], default: [] },
    offerState: {
      driverId: { type: Schema.Types.ObjectId, ref: "User" },
      expiresAt: { type: Date }
    },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    lastTrackingAt: { type: Date },
    lastKnownDriverLocation: {
      point: { type: geoPointSchema },
      accuracy: { type: Number },
      speed: { type: Number },
      recordedAt: { type: Date }
    }
  },
  { timestamps: true }
);

bookingSchema.index({ "pickup.point": "2dsphere" });

export const BookingModel = mongoose.model("Booking", bookingSchema);
