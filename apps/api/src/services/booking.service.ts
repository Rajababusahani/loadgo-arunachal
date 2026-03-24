import mongoose from "mongoose";
import type { BookingStatus, LocationPoint, PaymentMethod, VehicleType } from "@loadgo/shared";
import { BOOKING_TRANSITIONS } from "../constants/transitions";
import { env } from "../config/env";
import { BookingModel } from "../models/Booking";
import { PaymentModel } from "../models/Payment";
import { UserModel } from "../models/User";
import { findCandidateDriverIds } from "./matching.service";
import { fetchDistanceAndDuration } from "./maps.service";
import { buildPricingBreakdown } from "./pricing.service";
import { publishBookingStatus } from "./tracking.service";
import { ApiError } from "../utils/api-error";
import { toGeoPoint } from "../utils/geo";

export async function createBooking(input: {
  userId: string;
  pickup: LocationPoint;
  drop: LocationPoint;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const route = await fetchDistanceAndDuration(input.pickup, input.drop);
  const quote = await buildPricingBreakdown(input.vehicleType, route.distanceKm, route.durationMinutes);
  const candidateDriverIds = await findCandidateDriverIds({
    lat: input.pickup.lat,
    lng: input.pickup.lng,
    vehicleType: input.vehicleType
  });

  const initialPaymentStatus = input.paymentMethod === "cash" ? "cash_due" : "pending";

  const booking = await BookingModel.create({
    userId: new mongoose.Types.ObjectId(input.userId),
    pickup: {
      address: input.pickup.address,
      landmark: input.pickup.landmark,
      point: toGeoPoint(input.pickup.lat, input.pickup.lng)
    },
    drop: {
      address: input.drop.address,
      landmark: input.drop.landmark,
      point: toGeoPoint(input.drop.lat, input.drop.lng)
    },
    distanceKm: quote.distanceKm,
    durationMinutes: quote.durationMinutes,
    estimatedPrice: quote.estimatedPrice,
    finalPrice: quote.estimatedPrice,
    vehicleType: input.vehicleType,
    status: "searching",
    paymentMethod: input.paymentMethod,
    paymentStatus: initialPaymentStatus,
    notes: input.notes,
    candidateDriverIds: candidateDriverIds.map((id) => new mongoose.Types.ObjectId(id))
  });

  await PaymentModel.create({
    bookingId: booking._id,
    method: input.paymentMethod,
    status: initialPaymentStatus,
    amount: quote.estimatedPrice,
    currency: "INR"
  });

  await assignNextDriver(booking.id);
  return booking;
}

export async function assignNextDriver(bookingId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const rejectedIds = booking.rejectedDriverIds.map((id: any) => id.toString());
  const remainingCandidates = booking.candidateDriverIds
    .map((id: any) => id.toString())
    .filter((candidateId: string) => !rejectedIds.includes(candidateId));

  const nextDriverId = remainingCandidates[0];
  if (!nextDriverId) {
    booking.offerState = undefined as any;
    await booking.save();
    await publishBookingStatus(booking.id, booking.status);
    return booking;
  }

  booking.offerState = {
    driverId: new mongoose.Types.ObjectId(nextDriverId),
    expiresAt: new Date(Date.now() + env.DRIVER_OFFER_TIMEOUT_SECONDS * 1000)
  } as any;
  await booking.save();
  await publishBookingStatus(booking.id, booking.status);
  return booking;
}

export async function ensureOfferFresh(bookingId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.offerState?.expiresAt && booking.offerState.expiresAt.getTime() < Date.now()) {
    if (booking.offerState.driverId) {
      booking.rejectedDriverIds.push(booking.offerState.driverId);
      booking.offerState = undefined as any;
      await booking.save();
    }

    return assignNextDriver(booking.id);
  }

  return booking;
}

export async function acceptDriverOffer(bookingId: string, driverUserId: string) {
  const booking = await ensureOfferFresh(bookingId);
  if (!booking.offerState?.driverId || booking.offerState.driverId.toString() !== driverUserId) {
    throw new ApiError(400, "This booking is not currently offered to the driver");
  }

  booking.driverId = new mongoose.Types.ObjectId(driverUserId);
  booking.offerState = undefined as any;
  booking.status = "assigned";
  booking.assignedAt = new Date();
  await booking.save();
  await publishBookingStatus(booking.id, booking.status);
  return booking;
}

export async function rejectDriverOffer(bookingId: string, driverUserId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  booking.rejectedDriverIds.push(new mongoose.Types.ObjectId(driverUserId));
  booking.offerState = undefined as any;
  await booking.save();
  return assignNextDriver(booking.id);
}

export async function transitionBookingStatus(bookingId: string, nextStatus: BookingStatus, actorUserId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.driverId && booking.driverId.toString() !== actorUserId && booking.userId.toString() !== actorUserId) {
    throw new ApiError(403, "Booking does not belong to the current user");
  }

  const allowedTransitions = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];
  if (!allowedTransitions.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move booking from ${booking.status} to ${nextStatus}`);
  }

  booking.status = nextStatus;
  if (nextStatus === "in_transit") {
    booking.startedAt = new Date();
  }

  if (nextStatus === "completed") {
    booking.completedAt = new Date();
    if (booking.paymentMethod === "cash") {
      booking.paymentStatus = "paid";
      await PaymentModel.findOneAndUpdate({ bookingId: booking._id }, { $set: { status: "paid", paidAt: new Date() } });
    }
  }

  await booking.save();
  await publishBookingStatus(booking.id, booking.status);
  return booking;
}

export async function cancelBooking(bookingId: string, customerUserId: string) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking || booking.userId.toString() !== customerUserId) {
    throw new ApiError(404, "Booking not found");
  }

  if (!["created", "searching", "assigned"].includes(booking.status)) {
    throw new ApiError(400, "Booking can no longer be cancelled");
  }

  booking.status = "cancelled";
  await booking.save();
  await publishBookingStatus(booking.id, booking.status);
  return booking;
}

export async function getBookingHistory(userId: string, role: string) {
  if (role === "driver") {
    return BookingModel.find({ driverId: userId }).sort({ createdAt: -1 }).lean();
  }

  if (role === "admin") {
    return BookingModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
  }

  return BookingModel.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getCurrentUserProfile(userId: string) {
  return UserModel.findById(userId).lean();
}
