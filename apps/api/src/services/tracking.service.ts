import { env } from "../config/env";
import { getFirebaseDatabase } from "../config/firebase";
import { BookingModel } from "../models/Booking";
import { DriverProfileModel } from "../models/DriverProfile";
import { toGeoPoint, isGpsPlausible } from "../utils/geo";
import { ApiError } from "../utils/api-error";

export async function publishBookingStatus(bookingId: string, status: string) {
  if (env.USE_MOCK_SERVICES) {
    return;
  }

  await getFirebaseDatabase().ref(`bookingStatus/${bookingId}`).set({
    status,
    updatedAt: new Date().toISOString()
  });
}

export async function cacheDriverTracking(input: {
  bookingId: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed?: number;
  heading?: number;
}) {
  if (!isGpsPlausible(input.speed, input.accuracy)) {
    throw new ApiError(400, "Rejected implausible GPS update");
  }

  const booking = await BookingModel.findById(input.bookingId);
  if (!booking || booking.driverId?.toString() !== input.driverId) {
    throw new ApiError(404, "Active booking not found for driver");
  }

  booking.lastTrackingAt = new Date();
  booking.lastKnownDriverLocation = {
    point: toGeoPoint(input.lat, input.lng),
    accuracy: input.accuracy,
    speed: input.speed,
    recordedAt: new Date()
  } as any;

  await booking.save();

  await DriverProfileModel.findOneAndUpdate(
    { userId: input.driverId },
    {
      $set: {
        currentLocation: toGeoPoint(input.lat, input.lng),
        lastLocationAt: new Date(),
        isGpsTrusted: true
      }
    }
  );

  if (!env.USE_MOCK_SERVICES) {
    await getFirebaseDatabase().ref(`bookingTracking/${input.bookingId}`).set({
      bookingId: input.bookingId,
      driverId: input.driverId,
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy,
      speed: input.speed,
      heading: input.heading,
      recordedAt: new Date().toISOString()
    });
  }
}
