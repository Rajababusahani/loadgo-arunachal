import mongoose, { Schema } from "mongoose";
import { USER_ROLES, type UserRole } from "@loadgo/shared";

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: USER_ROLES satisfies readonly UserRole[], default: "customer", index: true },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    themeMode: { type: String, enum: ["light", "dark", "system"], default: "system" },
    lastKnownLocation: {
      address: { type: String },
      point: { type: geoPointSchema, index: "2dsphere" },
      updatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);
