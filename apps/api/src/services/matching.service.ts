import mongoose from "mongoose";
import type { VehicleType } from "@loadgo/shared";
import { env } from "../config/env";
import { DriverProfileModel } from "../models/DriverProfile";

export async function findCandidateDriverIds(params: {
  lat: number;
  lng: number;
  vehicleType: VehicleType;
}): Promise<string[]> {
  const staleThreshold = new Date(Date.now() - env.TRACKING_STALE_SECONDS * 1000);
  const maxDistanceMeters = env.MATCHING_RADIUS_KM * 1000;

  const drivers = await DriverProfileModel.find({
    vehicleType: params.vehicleType,
    approvalStatus: "approved",
    availability: "online",
    currentLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [params.lng, params.lat]
        },
        $maxDistance: maxDistanceMeters
      }
    },
    lastLocationAt: { $gte: staleThreshold }
  })
    .select("userId")
    .lean();

  return drivers.map((driver) => new mongoose.Types.ObjectId(driver.userId).toString());
}
